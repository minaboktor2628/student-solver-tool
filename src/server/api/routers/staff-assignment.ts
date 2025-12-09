import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";

export const staffAssignmentRoute = createTRPCRouter({
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
  // swap: coordinatorProcedure
  //   .input(
  //     z.object({
  //       firstStudent: z.object({
  //         staffId: z.string(),
  //         sectionId: z.string(),
  //       }),
  //       secondStudent: z.object({
  //         staffId: z.string(),
  //         sectionId: z.string(),
  //       }),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input: { secondStudent, firstStudent } }) => {
  //     if (secondStudent.staffId == firstStudent.staffId) {
  //       throw new TRPCError({
  //         code: "BAD_REQUEST",
  //         message: "Cannot swap the same staff member with themselves",
  //       });
  //     }
  //     return;
  //   }),
});
