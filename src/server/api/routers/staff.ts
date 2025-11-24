import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";

export const staffRoute = createTRPCRouter({
  getQualifiedStaffForCourse: coordinatorProcedure
    .input(z.object({ sectionId: z.string() }))
    .query(async ({ input: { sectionId }, ctx }) => {
      return ctx.db.$transaction(async (tx) => {
        // Get the term of this section
        const section = await tx.section.findUnique({
          where: { id: sectionId },
          select: { termId: true },
        });
        if (!section) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Section not found",
          });
        }
        const { termId } = section;

        // Qualified + not avoided for this section
        const qualified = await tx.staffPreferenceQualifiedSection.findMany({
          where: {
            sectionId,
            staffPreference: {
              user: {
                avoidedInCourses: {
                  none: { professorPreference: { sectionId } },
                },
              },
            },
          },
          include: {
            staffPreference: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    hours: true,
                    roles: { select: { role: true } },
                  },
                },
              },
            },
          },
        });

        // Flatten users + roles
        const users = qualified.map(({ staffPreference }) => {
          const u = staffPreference.user;
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            hours: u.hours,
            roles: u.roles.map((r) => r.role),
          };
        });

        if (users.length === 0) {
          return { available: [], alreadyAssigned: [], count: 0 };
        }

        const userIds = users.map((u) => u.id);

        // Who is already assigned to *any* section in this term?
        const assignedRows = await tx.sectionAssignment.findMany({
          where: {
            staffId: { in: userIds },
            section: { termId }, // assignment's section belongs to this term
          },
          select: { staffId: true },
          distinct: ["staffId"], // one row per staffId
        });

        const assignedSet = new Set(assignedRows.map((r) => r.staffId));

        // Split into buckets
        const available = users.filter((u) => !assignedSet.has(u.id));
        const alreadyAssigned = users.filter((u) => assignedSet.has(u.id));

        return { available, alreadyAssigned, count: users.length };
      });
    }),
});
