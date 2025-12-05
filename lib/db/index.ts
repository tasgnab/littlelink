import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { config } from "@/lib/config";

const sql = neon(config.database.url);
export const db = drizzle(sql, { schema });
