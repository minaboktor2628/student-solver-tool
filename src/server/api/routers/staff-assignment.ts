import { TRPCError } from "@trpc/server";
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
      return ctx.db.$transaction(async (tx) => {
        // Ensure staff is qualified
        const qualified = await tx.staffPreferenceQualifiedSection.count({
          where: {
            sectionId,
            staffPreference: { userId: staffId },
          },
        });
        if (qualified === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is not qualified for this section",
          });
        }

        // Ensure staff is not an anti-preference of professor teaching this course
        const avoided = await tx.professorPreferenceAvoidedStaff.count({
          where: {
            staffId,
            professorPreference: { sectionId }, // professorPreference is unique per section
          },
        });
        if (avoided > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Professor has marked this staff as avoided for this section",
          });
        }

        return tx.sectionAssignment.upsert({
          where: { sectionId_staffId: { sectionId, staffId } },
          create: { sectionId, staffId },
          update: {},
        });
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
