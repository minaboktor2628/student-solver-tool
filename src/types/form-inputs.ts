import { TermLetter } from "@prisma/client";
import z from "zod";

export const createTermInputSchema = z.object({
  termLetter: z.nativeEnum(TermLetter),
  year: z.number().int().nonnegative(),
  termStaffDueDate: z.coerce.date(),
  termProfessorDueDate: z.coerce.date(),
});
