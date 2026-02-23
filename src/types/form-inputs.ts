import { Role, TermLetter } from "@prisma/client";
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
