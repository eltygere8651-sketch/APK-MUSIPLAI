const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const oldDb = `async function getClientDb() {
  if (clientDb) return clientDb;
  const { initializeApp } = await import("firebase/app");
  const { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } = await import("firebase/firestore");
  const configPath = require("path").join(process.cwd(), "firebase-applet-config.json");
  if (!require("fs").existsSync(configPath)) return null;
  const config = JSON.parse(require("fs").readFileSync(configPath, "utf-8"));
  const app = initializeApp(config);
  clientDb = initializeFirestore(app, {}, config.firestoreDatabaseId);
  return clientDb;
}`;

const newDb = `
import fs from "fs";
import path from "path";

async function getClientDb() {
  if (clientDb) return clientDb;
  const { initializeApp } = await import("firebase/app");
  const { getFirestore, initializeFirestore } = await import("firebase/firestore");
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) return null;
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const app = initializeApp(config);
  clientDb = initializeFirestore(app, {}, config.firestoreDatabaseId);
  return clientDb;
}`;

code = code.replace(oldDb, newDb);
fs.writeFileSync('server.ts', code);
