// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { parse } = require("csv-parse");

admin.initializeApp();
const firestore = admin.firestore();

// --- EXISTING FUNCTIONS (NO CHANGES) ---
exports.activateUserTrial = functions.https.onCall(async (data, context) => { /* ... same as before ... */ });


// --- NEW, MORE ROBUST FUNCTION TO PROCESS CSVs ---
exports.processPropertyCSV = functions.storage.object().onFinalize(async (object) => {
    const fileBucket = object.bucket;
    const filePath = object.name;
    const contentType = object.contentType;

    if (!filePath.startsWith('property-uploads/') || !contentType.startsWith('text/csv')) {
        return console.log(`Not a target file, skipping: ${filePath}`);
    }

    const agentId = filePath.split('/')[1];
    if (!agentId) {
        return console.error("Could not determine agentId from path:", filePath);
    }
    
    const bucket = admin.storage().bucket(fileBucket);
    const file = bucket.file(filePath);

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
            if (!record.property_link) continue;

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

    return file.delete();
});