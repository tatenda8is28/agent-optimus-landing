// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { getStorage } = require("firebase-admin/storage");
const { parse } = require("csv-parse");

admin.initializeApp();

// --- EXISTING FUNCTIONS (NO CHANGES) ---
exports.activateUserTrial = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to call this function.');
    }
    const callerUid = context.auth.uid;
    const targetUserId = data.userId;
    try {
        const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
        if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'This function can only be called by an admin user.');
        }
        if (!targetUserId) {
            throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "userId" argument.');
        }
        const userDocRef = admin.firestore().collection('users').doc(targetUserId);
        await userDocRef.update({ status: 'ACTIVE_TRIAL' });
        console.log(`Successfully activated user: ${targetUserId}`);
        return { success: true, message: `User ${targetUserId} has been activated.` };
    } catch (error) {
        if (error instanceof functions.https.HttpsError) { throw error; }
        console.error("Error activating user:", error);
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred.');
    }
});


// --- NEW FUNCTION TO PROCESS UPLOADED CSVs ---
exports.processPropertyCSV = onObjectFinalized({ cpu: 2, memory: '512MiB' }, async (event) => {
    const fileBucket = event.data.bucket;
    const filePath = event.data.name;
    
    // Ensure the file is a CSV and in the correct folder
    if (!filePath.startsWith('property-uploads/') || !filePath.endsWith('.csv')) {
        return console.log(`Not a target file, skipping: ${filePath}`);
    }

    const agentId = filePath.split('/')[1];
    if (!agentId) {
        return console.error("Could not determine agentId from path:", filePath);
    }

    const storage = getStorage();
    const bucket = storage.bucket(fileBucket);
    const file = bucket.file(filePath);
    const firestore = admin.firestore();

    console.log(`Processing CSV for agent ${agentId}: ${filePath}`);

    const parser = file.createReadStream().pipe(parse({
        delimiter: ';',
        columns: header => header.map(h => h.trim().toLowerCase().replace(/ /g, '_').replace('﻿', '')),
        skip_empty_lines: true,
    }));

    const writeBatch = firestore.batch();
    let recordCount = 0;

    for await (const record of parser) {
        try {
            if (!record.property_link) continue; // Skip rows without a property link

            // Use a hash of the property link as a stable document ID to prevent duplicates
            const docId = Buffer.from(record.property_link).toString('base64');
            const docRef = firestore.collection('properties').doc(docId);

            const priceNum = parseInt(record.p24_price?.replace(/[^0-9]/g, '')) || 0;
            
            const newPropertyData = {
                agentId: agentId,
                propertyUrl: record.property_link || '',
                imageUrl: record.image_link === 'https://www.property24.com/blank.gif' ? '' : record.image_link,
                price: priceNum,
                title: record.p24_title || '',
                location: record.p24_location || '',
                description: record.p24_details || '',
                bedrooms: parseInt(record.bedroom) || null,
                bathrooms: parseFloat(record.bath) || null,
                garages: parseInt(record.garage) || null,
                size: record.p24_size || '',
                source: "Property24",
                status: 'Active',
                isAiEnabled: true,
                createdAt: new Date(),
                lastEditedBy: 'importer'
            };
            
            writeBatch.set(docRef, newPropertyData, { merge: true });
            recordCount++;

        } catch(e) {
            console.error("Error processing record:", record, e);
        }
    }
    
    await writeBatch.commit();
    console.log(`Successfully processed ${recordCount} properties for agent ${agentId}.`);

    // Delete the file after processing to save space and prevent re-processing
    await file.delete();
});