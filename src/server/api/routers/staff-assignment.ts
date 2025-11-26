import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";

export const staffAssignmentRoute = createTRPCRouter({
  set: coordinatorProcedure
    .input(
      z.object({
        sectionId: z.string(),
        staffId: z.string(),
      }),
    )
    .mutation(async ({ input: { sectionId, staffId }, ctx }) => {
      return ctx.db.sectionAssignment.upsert({
        where: { sectionId_staffId: { sectionId, staffId } },
        create: { sectionId, staffId },
        update: {},
      });
    }),

  remove: coordinatorProcedure
    .input(
      z.object({
        sectionId: z.string(),
        staffId: z.string(),
      }),
    )
    .mutation(async ({ input: { sectionId, staffId }, ctx }) => {
      return ctx.db.sectionAssignment.delete({
        where: { sectionId_staffId: { sectionId, staffId } },
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
