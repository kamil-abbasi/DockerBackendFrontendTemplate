import z from "zod";

/**
 * Field rules for the user domain. Every module that accepts user input builds
 * its request schemas out of these, so the constraints stay in one place and
 * keep matching the column definitions in `common/db/schemas/users.ts`.
 */

export const userIdSchema = z.uuid();

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "username must be at least 3 characters")
  .max(255);

export const passwordSchema = z
  .string()
  .min(8, "password must be at least 8 characters")
  .max(128);

export const firstNameSchema = z.string().trim().min(1).max(255);

export const lastNameSchema = z.string().trim().min(1).max(255);

export const pictureUrlSchema = z.url().max(512);
