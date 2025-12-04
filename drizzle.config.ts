import { defineConfig } from "drizzle-kit";
import { config } from "./lib/config";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: config.database.url,
  },
});
