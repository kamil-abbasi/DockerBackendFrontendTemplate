import z from "zod";

import { passwordSchema, usernameSchema } from "@/users/schemas";

export const signupSchema = z
  .strictObject({
    username: usernameSchema,
    password: passwordSchema,
    repeatedPassword: passwordSchema,
  })
  .refine((body) => body.password === body.repeatedPassword, {
    error: "passwords must be equal",
    path: ["repeatedPassword"],
  });

export const loginSchema = z.strictObject({
  username: usernameSchema,
  // deliberately not `passwordSchema`: login must accept whatever was accepted
  // at signup time, and rejecting on policy here only leaks the policy
  password: z.string().min(1, "password is required"),
});
