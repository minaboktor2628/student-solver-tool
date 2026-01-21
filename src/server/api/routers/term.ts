/* Term related endpoints */
import { createTRPCRouter, publicProcedure } from "../trpc";

export const termRoute = createTRPCRouter({
  getTerms: publicProcedure.query(async ({ ctx }) => {
    const all = await ctx.db.term.findMany({
      orderBy: [{ year: "desc" }, { termLetter: "desc" }],
      select: { active: true, year: true, termLetter: true, id: true },
    });

    // combine year and term letter into label field for convenience
    const withLabel = all.map((t) => ({
      ...t,
      label: `${t.year} ${t.termLetter}`,
    }));

    // assuming only one active term at a time
    const active = withLabel.find((t) => t.active) ?? null;

    return { active, all: withLabel };
  }),

  getActive: publicProcedure.query(async ({ ctx }) => {
    // find first because only supposed to have one active term
    return ctx.db.term.findFirst({
      where: { active: true },
      select: { active: true, year: true, termLetter: true, id: true },
    });
  }),
});
