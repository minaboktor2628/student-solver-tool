// put db calls for permission checks here
import { db } from "@/server/db";

export async function isUserAllowedInActiveTerm(
  userId: string,
): Promise<boolean> {
  const activeTerm = await db.term.findFirst({
    where: { active: true, allowedUsers: { some: { id: userId } } },
  });
  if (!activeTerm) return false;
  else return true; // if this term exists, then they are allowed
}
