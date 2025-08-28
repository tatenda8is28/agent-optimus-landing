// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.activateUserTrial = functions.https.onCall(async (data, context) => {
    // --- NEW, MORE ROBUST SECURITY CHECK ---
    // 1. Check if the user is logged in at all.
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to call this function.');
    }

    const callerUid = context.auth.uid;
    const targetUserId = data.userId;

    try {
        // 2. Check if the CALLER has an 'admin' role in the Firestore database.
        const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
        if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'This function can only be called by an admin user.');
        }

        // 3. Data Validation
        if (!targetUserId) {
            throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "userId" argument.');
        }

        // 4. Core Logic: Update the target user's status.
        const userDocRef = admin.firestore().collection('users').doc(targetUserId);
        await userDocRef.update({ status: 'ACTIVE_TRIAL' });

        console.log(`Successfully activated user: ${targetUserId}`);
        return { success: true, message: `User ${targetUserId} has been activated.` };

    } catch (error) {
        // Re-throw HttpsError directly, handle others
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        console.error("Error activating user:", error);
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred.');
    }
});