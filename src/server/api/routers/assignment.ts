import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { solverStrategies } from "@/lib/solver";

export const assignmentRoute = createTRPCRouter({
  set: coordinatorProcedure
    .input(z.object({ sectionId: z.string(), staffId: z.string() }))
    .mutation(async ({ input: { sectionId, staffId }, ctx }) => {
      return ctx.db.sectionAssignment.upsert({
        where: { sectionId_staffId: { sectionId, staffId } },
        create: { sectionId, staffId },
        update: {},
      });
    }),

  remove: coordinatorProcedure
    .input(z.object({ sectionId: z.string(), staffId: z.string() }))
    .mutation(async ({ input: { sectionId, staffId }, ctx }) => {
      return ctx.db.sectionAssignment.deleteMany({
        where: { sectionId, staffId },
      });
    }),

  toggleAssignmentLock: coordinatorProcedure
    .input(z.object({ sectionId: z.string(), staffId: z.string() }))
    .mutation(async ({ input: { sectionId, staffId }, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        const current = await tx.sectionAssignment.findUnique({
          where: { sectionId_staffId: { sectionId, staffId } },
          select: { id: true, locked: true },
        });
        if (!current)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assignment not found.",
          });

        return tx.sectionAssignment.update({
          where: { sectionId_staffId: { sectionId, staffId } },
          data: { locked: !current.locked },
          select: { id: true, locked: true, sectionId: true, staffId: true },
        });
      });
    }),

  solve: coordinatorProcedure
    .input(
      z.object({
        termId: z.string(),
        solverStrategy: z.enum(solverStrategies),
      }),
    )
    .mutation(async ({ input: { termId }, ctx }) => {
      const [sections, staffPreferences] = await Promise.all([
        ctx.db.section.findMany({
          where: { termId },
          include: {
            assignments: true,
            preferredPreferences: true,
            professor: true,
            professorPreference: true,
            qualifiedPreferences: true,
          },
        }),
        ctx.db.staffPreference.findMany({
          where: {
            termId,
            // Only return users who are NOT locked to a section already this term
            user: {
              sectionAssignments: {
                none: {
                  locked: true,
                  section: {
                    termId,
                  },
                },
              },
            },
          },
          include: {
            preferredSections: true,
            qualifiedForSections: true,
            timesAvailable: true,
            user: true,
          },
        }),
      ]);

      // do some solving here and write to the db
      // frontend will refetch after this function completes, so no need to return anything
      // ...
    }),
});
