export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ status: "ok", environment: process.env.NODE_ENV || "development", timestamp: new Date().toISOString() });
}
