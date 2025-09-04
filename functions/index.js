// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { parse } = require("csv-parse");
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
        if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
            throw new HttpsError('permission-denied', 'This function can only be called by an admin.');
        }
        if (!targetUserId) {
            throw new HttpsError('invalid-argument', 'Missing "userId" argument.');
        }
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
    
    const parser = file.createReadStream().pipe(parse({
        delimiter: ';',
        columns: header => header.map(h => h.trim().toLowerCase().replace(/ /g, '_').replace('﻿', '')),
        skip_empty_lines: true,
    }));

    const writeBatch = firestore.batch();
    let recordCount = 0;

    for await (const record of parser) {
        try {
            if (!record.property_url) continue;

            const docId = Buffer.from(record.property_url).toString('base64');
            const docRef = firestore.collection('properties').doc(docId);
            
            const priceNum = parseInt(record.price?.replace(/[^0-9]/g, '')) || 0;
            
            const newPropertyData = {
                agentId: agentId,
                propertyUrl: record.property_url || '',
                imageUrl: record.image_url || '',
                price: priceNum,
                title: record.title || '',
                address: record.address || '',
                suburb: record.suburb || '',
                description: record.description || '',
                bedrooms: parseInt(record.bedrooms) || null,
                bathrooms: parseFloat(record.bathrooms) || null,
                garages: parseInt(record.garages) || null,
                size: record.size || '',
                source: "Property24",
                status: 'Active',
                isAiEnabled: true,
                createdAt: new Date(),
                lastEditedBy: 'importer'
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
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in.');
    }
    const agentId = request.auth.uid;
    const { fileContent, fileName } = request.data;
    
    if (!fileContent || !fileName) {
        throw new HttpsError('invalid-argument', 'Missing file content or name.');
    }

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