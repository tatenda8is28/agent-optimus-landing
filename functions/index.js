// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { parse } = require("csv-parse");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

// Initialize Admin SDK once
admin.initializeApp();
const firestore = admin.firestore();

/**
 * A callable function to activate a user's trial.
 * This is triggered from the Admin Dashboard.
 */
exports.activateUserTrial = onCall(async (request) => {
    // 1. Authentication Check
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to call this function.');
    }
    const callerUid = request.auth.uid;
    const targetUserId = request.data.userId;

    try {
        // 2. Authorization Check (Reads the caller's role from Firestore)
        const callerDoc = await firestore.collection('users').doc(callerUid).get();
        if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
            throw new HttpsError('permission-denied', 'This function can only be called by an admin user.');
        }

        // 3. Data Validation
        if (!targetUserId) {
            throw new HttpsError('invalid-argument', 'The function must be called with a "userId" argument.');
        }

        // 4. Core Logic
        const userDocRef = firestore.collection('users').doc(targetUserId);
        await userDocRef.update({ status: 'ACTIVE_TRIAL' });

        logger.log(`Successfully activated user: ${targetUserId}`);
        return { success: true, message: `User ${targetUserId} has been activated.` };
    } catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }
        logger.error("Error activating user:", error, { structuredData: true });
        throw new HttpsError('internal', 'An unexpected error occurred while activating the user.');
    }
});

/**
 * A standard HTTPS function to process CSVs.
 * This function will be triggered by an Eventarc trigger that we create manually
 * in the Google Cloud Console, which is a more robust method.
 */
exports.processPropertyCSV = functions.https.onRequest(async (req, res) => {
    // The Eventarc trigger sends the event payload in the request body.
    const logEntry = req.body;
    const fileData = logEntry.data;

    // Check if the request body contains the expected data from the trigger.
    if (!fileData || !fileData.name || !fileData.bucket) {
        logger.error("Invalid request body received. Not a valid Cloud Storage event.", req.body);
        res.status(400).send("Bad Request: Invalid Cloud Storage event payload.");
        return;
    }

    const fileBucket = fileData.bucket;
    const filePath = fileData.name;

    if (!filePath.startsWith('property-uploads/')) {
        logger.log(`Not a target file, skipping: ${filePath}`);
        res.status(200).send("File ignored as it's not in the property-uploads directory.");
        return;
    }

    const agentId = filePath.split('/')[1];
    if (!agentId) {
        logger.error("Could not determine agentId from path:", filePath);
        res.status(400).send("Bad Request: Invalid file path structure.");
        return;
    }
    
    const bucket = admin.storage().bucket(fileBucket);
    const file = bucket.file(filePath);

    logger.log(`Processing CSV for agent ${agentId}: ${filePath}`);
    
    const parser = file.createReadStream().pipe(parse({
        delimiter: ';',
        columns: header => header.map(h => h.trim().toLowerCase().replace(/ /g, '_').replace('﻿', '')),
        skip_empty_lines: true,
    }));

    const writeBatch = firestore.batch();
    let recordCount = 0;

    try {
        for await (const record of parser) {
            if (!record.property_link) continue;

            const docId = Buffer.from(record.property_link).toString('base64');
            const docRef = firestore.collection('properties').doc(docId);
            const priceNum = parseInt(record.p24_price?.replace(/[^0-9]/g, '')) || 0;
            
            const newPropertyData = {
                agentId: agentId, propertyUrl: record.property_link || '',
                imageUrl: record.image_link === 'https://www.property24.com/blank.gif' ? '' : record.image_link,
                price: priceNum, title: record.p24_title || '', location: record.p24_location || '',
                description: record.p24_details || '', bedrooms: parseInt(record.bedroom) || null,
                bathrooms: parseFloat(record.bath) || null, garages: parseInt(record.garage) || null,
                size: record.p24_size || '', source: "Property24", status: 'Active', isAiEnabled: true,
                createdAt: new Date(), lastEditedBy: 'importer'
            };
            
            writeBatch.set(docRef, newPropertyData, { merge: true });
            recordCount++;
        }
        
        await writeBatch.commit();
        logger.log(`Successfully processed ${recordCount} properties for agent ${agentId}.`);
        
        await file.delete();
        
        res.status(200).send(`Successfully processed ${recordCount} properties.`);
    } catch (error) {
        logger.error("Failed to process CSV:", error, { structuredData: true });
        res.status(500).send("Internal Server Error.");
    }
});