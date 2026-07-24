import admin from "firebase-admin";
import fs from "fs";
const serviceAccount = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount.serviceAccount) });
const db = admin.firestore();

async function test() {
  const doc = await db.collection("app_settings").doc("explore_layout").get();
  console.log(JSON.stringify(doc.data(), null, 2));
}
test().catch(console.error).finally(() => process.exit(0));
