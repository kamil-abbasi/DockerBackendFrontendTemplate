import type z from "zod";

import type { loginSchema, signupSchema } from "./schemas";

export type SignupDto = z.infer<typeof signupSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

export type SingupResponseDto = {
  userId: string;
  createdAt: string;
};

export type LoginResponseDto = {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  loggedInAt: string;
};

export type LogoutResponseDto = {
  userId: string;
  loggedOutAt: string;
};
