import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getSolverData,
  solveAssignments,
  solverStrategies,
} from "@/lib/solver";
import { api } from "@/trpc/server";

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

  // for a given term, unassign everyone to all sections who are not locked
  // to a section already (by the coordinator)
  removeAllUnlockedAssignments: coordinatorProcedure
    .input(z.object({ termId: z.string() }))
    .mutation(async ({ input: { termId }, ctx }) => {
      return ctx.db.sectionAssignment.deleteMany({
        where: { section: { termId }, locked: false },
      });
    }),

  solve: coordinatorProcedure
    .input(
      z.object({
        termId: z.string(),
        solverStrategy: z.enum(solverStrategies),
      }),
    )
    .mutation(async ({ input: { termId, solverStrategy }, ctx }) => {
      // first, remove all people who are assigned to a course but not locked.
      await api.assignment.removeAllUnlockedAssignments({ termId });

      const solverData = await getSolverData(ctx, termId);
      const assignments = solveAssignments(solverStrategy, solverData);

      console.log("Solver returned assignments:", assignments.size, "sections");

      // Insert assignments
      const assignmentRecords = [];
      for (const [sectionId, staffIds] of assignments) {
        for (const staffId of staffIds) {
          assignmentRecords.push({ sectionId, staffId });
        }
      }

      console.log("Creating", assignmentRecords.length, "assignment records");

      if (assignmentRecords.length > 0) {
        await Promise.all(
          assignmentRecords.map((record) =>
            ctx.db.sectionAssignment.upsert({
              where: {
                sectionId_staffId: {
                  sectionId: record.sectionId,
                  staffId: record.staffId,
                },
              },
              create: {
                sectionId: record.sectionId,
                staffId: record.staffId,
              },
              update: {},
            }),
          ),
        );
      }
    }),
});
