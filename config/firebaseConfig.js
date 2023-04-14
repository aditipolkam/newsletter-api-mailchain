const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.js");

const firebaseadmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
module.exports = db;
