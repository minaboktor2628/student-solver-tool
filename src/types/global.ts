// types from DB exported here so we don't have to directly import them from prisma
export {
  AcademicLevel,
  Role,
  Day,
  TermLetter,
  PreferenceLevel,
} from "prisma/generated/enums";

export type { Section, User } from "prisma/generated/client";
