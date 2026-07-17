import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle",
	schema: "./schemas/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DB_URL!,
	},
});
