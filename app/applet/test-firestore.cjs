const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
admin.initializeApp({ projectId: config.projectId });
const db = getFirestore(config.firestoreDatabaseId);
db.collection("system_settings").doc("telegram").get().then(doc => {
  console.log("Exists?", doc.exists);
  if (doc.exists) console.log(doc.data());
}).catch(console.error);
