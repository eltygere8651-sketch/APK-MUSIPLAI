import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount.serviceAccount) });
}
const db = admin.firestore();

async function test() {
  console.log("Fetching users...");
  const snap = await db.collection("users").get();
  console.log(`Total users in Firestore: ${snap.size}`);
  snap.forEach(doc => {
    console.log(`User ID: ${doc.id}, Email: ${doc.data().email}, CreatedAt: ${doc.data().createdAt}, Plan: ${doc.data().plan}, SubscriptionEnd: ${doc.data().subscriptionEnd}`);
  });
}
test().catch(console.error).finally(() => process.exit(0));
