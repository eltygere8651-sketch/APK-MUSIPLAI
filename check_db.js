import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const q = query(collection(db, "explore_custom_playlists"));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(doc.id, "=>", doc.data().title);
  });
}
check().catch(console.error);
