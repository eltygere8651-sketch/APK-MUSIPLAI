import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  console.log("Fetching admin collection docs...");
  const snap = await getDocs(collection(db, "admin"));
  console.log(`Docs count: ${snap.size}`);
  snap.forEach(doc => {
    console.log(`Doc ID: ${doc.id}`, doc.data());
  });
}
check().catch(console.error).finally(() => process.exit(0));
