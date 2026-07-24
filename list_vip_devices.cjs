const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin-config.json");

if (!admin.apps.length) {
  try { admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }); } catch (e) {}
}

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection("vip_devices").get();
  console.log("Devices:");
  snapshot.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
}
run();
