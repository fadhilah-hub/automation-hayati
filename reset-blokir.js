import "dotenv/config";
import pg from "pg";

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

await client.connect();
await client.query("DELETE FROM public.cache");
await client.query("DELETE FROM public.cache_locks");
await client.end();
console.log("Blokir login direset");
