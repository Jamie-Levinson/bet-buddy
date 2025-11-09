import { z } from "zod";

export const updateEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  nickname: z.string().max(50, "Nickname must be less than 50 characters").nullish(),
  timezone: z.string().refine(
    (tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid timezone" }
  ),
  preferredOddsFormat: z.enum(["decimal", "american"]),
});

export type UpdateEmailData = z.infer<typeof updateEmailSchema>;
export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

