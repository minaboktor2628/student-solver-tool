import { Role, TermLetter } from "@/types/global";
import z from "zod";

export const createTermInputSchema = z.object({
  termLetter: z.nativeEnum(TermLetter),
  year: z.coerce.number().int().nonnegative(),
  termStaffDueDate: z.coerce.date(),
  termProfessorDueDate: z.coerce.date(),
});

export const createUserInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
});

export const updateUserInputSchema = z.object({
  userId: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  hours: z.number().int().nonnegative().optional(),
});
