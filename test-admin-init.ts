import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
admin.initializeApp({
  projectId: config.projectId,
});

const db = getFirestore(config.firestoreDatabaseId);

async function test() {
  try {
    const snap = await db.collection("announcements").limit(1).get();
    console.log("Admin get success:", snap.size);
  } catch (e: any) {
    console.error("Admin get failed:", e.message);
  }
}
test();
