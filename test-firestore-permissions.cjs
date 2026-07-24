const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, limit, getDocs, collectionGroup, where, orderBy } = require("firebase/firestore");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const q1 = query(collection(db, "announcements"), limit(1));
    await getDocs(q1);
    console.log("announcements GET success");
  } catch (e) {
    console.error("announcements GET failed:", e.message);
  }

  try {
    const q2 = query(collectionGroup(db, "playlists"), where("isPublic", "==", true), orderBy("createdAt", "desc"), limit(1));
    await getDocs(q2);
    console.log("playlists GET success");
  } catch (e) {
    console.error("playlists GET failed:", e.message);
  }
}
test();
