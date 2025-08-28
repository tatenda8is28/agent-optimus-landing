// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK ONCE at the top.
admin.initializeApp();

/**
 * A one-time-use HTTPS function to set a custom claim on a user.
 */
exports.setAdminClaim = functions.https.onRequest(async (req, res) => {
  const targetEmail = "aaronmutsvanga2@gmail.com";
  try {
    const user = await admin.auth().getUserByEmail(targetEmail);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    res.status(200).send(`Success! The user ${targetEmail} has been made an admin.`);
  } catch (error) {
    console.error("Error setting custom claim:", error);
    res.status(500).send(`Error: ${error.message}`);
  }
});


/**
 * A callable function to activate a user's trial.
 * This is triggered from the Admin Dashboard.
 */
exports.activateUserTrial = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check: Ensure the user calling this function is an admin.
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'This function can only be called by an admin user.'
    );
  }

  // 2. Data Validation: Ensure the target user ID was passed in.
  const targetUserId = data.userId;
  if (!targetUserId) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'The function must be called with a "userId" argument.'
    );
  }

  try {
    // 3. The Core Logic: Update the user's document in Firestore.
    const userDocRef = admin.firestore().collection('users').doc(targetUserId);
    await userDocRef.update({
      status: 'ACTIVE_TRIAL'
    });

    console.log(`Successfully activated user: ${targetUserId}`);
    return { success: true, message: `User ${targetUserId} has been activated.` };

  } catch (error) {
    console.error("Error activating user:", error);
    throw new functions.https.HttpsError(
      'internal', 
      'An unexpected error occurred while activating the user.'
    );
  }
});