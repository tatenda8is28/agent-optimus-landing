// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { parse } = require("csv-parse");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

admin.initializeApp();
const firestore = admin.firestore();

exports.activateUserTrial = onCall(async (request) => {
    if (!request.auth) { throw new HttpsError('unauthenticated', 'You must be logged in.'); }
    const callerUid = request.auth.uid;
    const targetUserId = request.data.userId;
    try {
        const callerDoc = await firestore.collection('users').doc(callerUid).get();
        if (!callerDoc.exists || callerDoc.data().role !== 'admin') { throw new HttpsError('permission-denied', 'This function can only be called by an admin.'); }
        if (!targetUserId) { throw new HttpsError('invalid-argument', 'Missing "userId" argument.'); }
        const userDocRef = firestore.collection('users').doc(targetUserId);
        await userDocRef.update({ status: 'ACTIVE_TRIAL' });
        logger.log(`Successfully activated user: ${targetUserId}`);
        return { success: true, message: `User ${targetUserId} has been activated.` };
    } catch (error) {
        if (error instanceof HttpsError) { throw error; }
        logger.error("Error activating user:", error);
        throw new HttpsError('internal', 'An unexpected error occurred.');
    }
});

async function processCSV(filePath, agentId) {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    logger.log(`Processing CSV for agent ${agentId}: ${filePath}`);
    const parser = file.createReadStream().pipe(parse({ delimiter: ';', columns: header => header.map(h => h.trim().toLowerCase().replace(/ /g, '_').replace('﻿', '')), skip_empty_lines: true }));
    const writeBatch = firestore.batch();
    let recordCount = 0;
    for await (const record of parser) {
        try {
            if (!record.property_url) continue;
            const docId = Buffer.from(record.property_url).toString('base64');
            const docRef = firestore.collection('properties').doc(docId);
            const priceNum = parseInt(record.price?.replace(/[^0-9]/g, '')) || 0;
            const newPropertyData = {
                agentId: agentId, propertyUrl: record.property_url || '', imageUrl: record.image_url || '',
                price: priceNum, title: record.title || '', address: record.suburb || '', suburb: record.suburb || '',
                description: record.description || '', bedrooms: parseInt(record.bedroom) || null, bathrooms: parseFloat(record.bath) || null,
                garages: parseInt(record.garage) || null, size: record.p24_size || '', source: "Property24",
                status: 'Active', isAiEnabled: true, createdAt: new Date(), lastEditedBy: 'importer'
            };
            writeBatch.set(docRef, newPropertyData, { merge: true });
            recordCount++;
        } catch(e) { logger.error("Error processing record:", record, e); }
    }
    await writeBatch.commit();
    logger.log(`Successfully processed ${recordCount} properties for agent ${agentId}.`);
    return file.delete();
}

exports.uploadPropertyCSV = onCall(async (request) => {
    if (!request.auth) { throw new HttpsError('unauthenticated', 'You must be logged in.'); }
    const agentId = request.auth.uid;
    const { fileContent, fileName } = request.data;
    if (!fileContent || !fileName) { throw new HttpsError('invalid-argument', 'Missing file content or name.'); }
    const bucket = admin.storage().bucket();
    const filePath = `property-uploads/${agentId}/${Date.now()}-${fileName}`;
    const file = bucket.file(filePath);
    try {
        const buffer = Buffer.from(fileContent, 'base64');
        await file.save(buffer, { contentType: 'text/csv' });
        logger.log(`File uploaded to: ${filePath}`);
        await processCSV(filePath, agentId);
        return { success: true, message: 'File processed successfully.' };
    } catch (error) {
        logger.error('Upload and processing failed:', error);
        throw new HttpsError('internal', 'Failed to upload and process file.');
    }
});

exports.analyzeLeadConversation = onDocumentUpdated("leads/{leadId}", async (event) => {
    const newData = event.data.after.data();
    const previousData = event.data.before.data();
    if (!newData.conversation || newData.conversation.length === (previousData.conversation?.length || 0)) { return null; }
    const conversationText = newData.conversation.map(msg => msg.content).join(' ').toLowerCase();
    const intelTags = new Set(newData.intelTags || []);
    if (conversationText.includes('cash')) { intelTags.add('💰 Cash Buyer'); }
    if (conversationText.includes('bond') || conversationText.includes('pre-approved')) { intelTags.add('💳 Bond Applicant'); }
    if (conversationText.includes('asap') || conversationText.includes('urgent') || conversationText.includes('soon')) { intelTags.add('🔥 Hot Lead'); }
    const newTagsArray = Array.from(intelTags);
    if (newTagsArray.length > (newData.intelTags?.length || 0)) {
        return event.data.after.ref.update({ intelTags: newTagsArray });
    }
    return null;
});

exports.deleteProperty = onCall(async (request) => {
    if (!request.auth) { throw new HttpsError('unauthenticated', 'You must be logged in.'); }
    const agentId = request.auth.uid;
    const { propertyId } = request.data;
    if (!propertyId) { throw new HttpsError('invalid-argument', 'Missing "propertyId" argument.'); }
    try {
        const docRef = firestore.collection('properties').doc(propertyId);
        const doc = await docRef.get();
        if (!doc.exists) { throw new HttpsError('not-found', 'Property document not found.'); }
        if (doc.data().agentId !== agentId) { throw new HttpsError('permission-denied', 'You do not have permission to delete this property.'); }
        await docRef.delete();
        logger.log(`User ${agentId} deleted property ${propertyId}`);
        return { success: true, message: "Property deleted successfully." };
    } catch (error) {
        if (error instanceof HttpsError) { throw error; }
        logger.error("Error deleting property:", error);
        throw new HttpsError('internal', 'An unexpected error occurred.');
    }
});

exports.deleteAllProperties = onCall(async (request) => {
    if (!request.auth) { throw new HttpsError('unauthenticated', 'You must be logged in.'); }
    const agentId = request.auth.uid;
    try {
        const propertiesQuery = firestore.collection('properties').where('agentId', '==', agentId);
        const snapshot = await propertiesQuery.get();
        if (snapshot.empty) { return { success: true, message: "No properties found to delete." }; }
        const batch = firestore.batch();
        snapshot.docs.forEach(doc => { batch.delete(doc.ref); });
        await batch.commit();
        logger.log(`User ${agentId} deleted ${snapshot.size} properties.`);
        return { success: true, message: `Successfully deleted ${snapshot.size} properties.` };
    } catch (error) {
        logger.error("Error deleting all properties:", error);
        throw new HttpsError('internal', 'An unexpected error occurred while deleting properties.');
    }
});

exports.deleteBooking = onCall(async (request) => {
    if (!request.auth) { throw new HttpsError('unauthenticated', 'You must be logged in.'); }
    const agentId = request.auth.uid;
    const { bookingId } = request.data;
    if (!bookingId) { throw new HttpsError('invalid-argument', 'Missing "bookingId" argument.'); }
    try {
        const docRef = firestore.collection('bookings').doc(bookingId);
        const doc = await docRef.get();
        if (!doc.exists) { throw new HttpsError('not-found', 'Booking document not found.'); }
        if (doc.data().agentId !== agentId) { throw new HttpsError('permission-denied', 'You do not have permission to delete this booking.'); }
        await docRef.delete();
        logger.log(`User ${agentId} deleted booking ${bookingId}`);
        return { success: true, message: "Event deleted successfully." };
    } catch (error) {
        if (error instanceof HttpsError) { throw error; }
        logger.error("Error deleting booking:", error);
        throw new HttpsError('internal', 'An unexpected error occurred.');
    }
});

exports.requestWhatsAppConnection = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to make this request.');
    }
    const agentId = request.auth.uid;
    try {
        const userDocRef = firestore.collection('users').doc(agentId);
        await userDocRef.update({ whatsappConnectionStatus: 'pending' });
        logger.log(`User ${agentId} has requested a WhatsApp connection.`);
        return { success: true, message: "Request sent successfully." };
    } catch (error) {
        logger.error("Error requesting WhatsApp connection:", error);
        throw new HttpsError('internal', 'An unexpected error occurred.');
    }
});