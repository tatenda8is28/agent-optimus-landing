// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * A one-time-use HTTPS function to set a custom claim on a user.
 * This function makes a specific user an admin.
 *
 * To run this, you must deploy it and then visit the URL in your browser.
 * Make sure to secure or delete this function after use.
 */
exports.setAdminClaim = functions.https.onRequest(async (req, res) => {
  // --- IMPORTANT: Manually set the target email here ---
  const targetEmail = "aaronmutsvanga2@gmail.com";

  try {
    // Get the user record from Firebase Auth based on their email
    const user = await admin.auth().getUserByEmail(targetEmail);

    // Set the custom claim on the user's account
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    // Send a success response
    res.status(200).send(
      `Success! The user ${targetEmail} has been made an admin. You can now close this tab.`
    );
  } catch (error) {
    console.error("Error setting custom claim:", error);
    res.status(500).send(`Error: ${error.message}`);
  }
});