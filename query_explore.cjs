const admin = require("firebase-admin");
const config = require("./firebase-applet-config.json");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.projectId,
    clientEmail: config.clientEmail,
    privateKey: config.privateKey
  }),
});

const db = admin.firestore();
db.settings({ databaseId: config.firestoreDatabaseId || "(default)" });

async function queryData() {
  const q = await db.collection("explore_custom_playlists").limit(2).get();
  q.forEach(doc => {
    console.log(doc.id, "=>", JSON.stringify(doc.data()).substring(0, 500));
  });
}
queryData();
