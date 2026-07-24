import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, limit, getDocs, collectionGroup, where, orderBy } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  console.log("Testing announcements...");
  try {
    const q1 = query(collection(db, "announcements"), limit(1));
    await getDocs(q1);
    console.log("announcements GET success");
  } catch (e: any) {
    console.error("announcements GET failed:", e.code, e.message);
  }

  console.log("Testing playlists...");
  try {
    const q2 = query(collectionGroup(db, "playlists"), where("isPublic", "==", true), orderBy("createdAt", "desc"), limit(1));
    await getDocs(q2);
    console.log("playlists GET success");
  } catch (e: any) {
    console.error("playlists GET failed:", e.code, e.message);
  }
  
  process.exit(0);
}
test();
