import { pgTable, timestamp, uuid, varchar, text } from "drizzle-orm/pg-core";

export type DbUser = typeof usersTable.$inferSelect;

export const usersTable = pgTable("users", {
  id: uuid().primaryKey(),
  username: varchar({ length: 255 }).notNull(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  pictureUrl: varchar({ length: 512 }),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp(),
  hashedPassword: text().notNull(),
});
