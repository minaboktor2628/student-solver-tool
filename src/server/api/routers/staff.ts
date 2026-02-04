/* Staff related endpoints */
import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { type Role, type Day, type PreferenceLevel } from "@prisma/client";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  hours: number;
  roles: Role[];
  comments: string | null;
  timesAvailable: Array<{ day: Day; hour: number }>;
  preferedSections: Array<{
    rank: PreferenceLevel;
    section: {
      id: string;
      courseTitle: string;
      courseCode: string;
      courseSection: string;
    };
  }>;
  locked: boolean;
  assignedSection: { id: string; code: string } | undefined;
  flags: {
    qualifiedForThisSection: boolean;
    notAvoidedByProfessor: boolean;
    availableThisTerm: boolean;
  };
};

export const staffRoute = createTRPCRouter({
  getStaffForSection: coordinatorProcedure
    .input(z.object({ sectionId: z.string().nullish() }))
    .query(async ({ input: { sectionId }, ctx }) => {
      if (!sectionId) return { staff: [] };

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

        // Qualified (by existence in this table) + dynamic user filters
        const staffPreferencesRaw = await tx.staffPreference.findMany({
          where: {
            termId,
            isAvailableForTerm: true,
            user: {
              sectionAssignments: {
                none: {
                  OR: [
                    { sectionId }, // already assigned to this section
                    { AND: [{ locked: true }, { NOT: { sectionId } }] }, // locked on a different section
                  ],
                },
              },
            },
          },
          include: {
            qualifiedForSections: {
              select: { sectionId: true },
            },
            preferredSections: {
              select: {
                rank: true,
                section: {
                  select: {
                    id: true,
                    courseTitle: true,
                    courseCode: true,
                    courseSection: true,
                  },
                },
              },
            },
            timesAvailable: {
              select: {
                day: true,
                hour: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                hours: true,
                roles: { select: { role: true } },
                avoidedInCourses: {
                  where: { professorPreference: { sectionId } },
                },
              },
            },
          },
        });

        // Type the result properly to avoid repeated type assertions
        type StaffPreferenceWithRelations =
          typeof staffPreferencesRaw extends Array<infer T> ? T : never;
        const staffPreferences = staffPreferencesRaw as Array<
          StaffPreferenceWithRelations & {
            user: {
              id: string;
              name: string | null;
              email: string | null;
              hours: number | null;
              roles: Array<{ role: Role }>;
              avoidedInCourses: unknown[];
            };
            qualifiedForSections: Array<{ sectionId: string }>;
            preferredSections: Array<{
              rank: number;
              section: {
                id: string;
                courseTitle: string;
                courseCode: string;
                courseSection: string;
              };
            }>;
            timesAvailable: Array<{ day: string; hour: number }>;
          }
        >;

        // Flatten users + roles
        const users = staffPreferences.map((sp) => {
          const u = sp.user;
          const qualifiedForThisSection = sp.qualifiedForSections.some(
            (q) => q.sectionId === sectionId,
          );
          const avoidedByProfessor = (u.avoidedInCourses?.length ?? 0) > 0;

          const mappedUser = {
            id: u.id ?? "",
            name: u.name ?? "",
            email: u.email ?? "",
            hours: u.hours ?? 0,
            roles: (u.roles ?? []).map((r) => r.role),
            comments: sp.comments ?? "",
            timesAvailable: sp.timesAvailable ?? [],
            preferedSections: sp.preferredSections ?? [],
            locked: false,
            flags: {
              qualifiedForThisSection,
              notAvoidedByProfessor: !avoidedByProfessor,
              // fill availableThisTerm after we know assignments
              availableThisTerm: true,
            },
          } as const satisfies {
            id: string;
            name: string;
            email: string;
            hours: number;
            roles: Role[];
            comments: string;
            timesAvailable: Array<{ day: Day; hour: number }>;
            preferedSections: Array<{
              rank: PreferenceLevel;
              section: {
                id: string;
                courseTitle: string;
                courseCode: string;
                courseSection: string;
              };
            }>;
            locked: boolean;
            flags: {
              qualifiedForThisSection: boolean;
              notAvoidedByProfessor: boolean;
              availableThisTerm: boolean;
            };
          };

          return mappedUser;
        });

        if (users.length === 0) {
          return { staff: [] };
        }

        const userIds = users.map((u) => u.id);

        // Who is already assigned to *any* section in this term?
        const assignedRows = await tx.sectionAssignment.findMany({
          where: {
            staffId: { in: userIds },
            section: { termId },
          },
          select: {
            staffId: true,
            section: {
              select: { id: true, courseCode: true, courseSection: true },
            },
          },
        });

        // Map staffId -> (one) section
        const assignedByStaffId = new Map<
          string,
          { id: string; code: string }
        >();
        for (const row of assignedRows) {
          // If they can only be assigned once per term, first one wins.
          if (!assignedByStaffId.has(row.staffId)) {
            assignedByStaffId.set(row.staffId, {
              id: row.section.id,
              code: row.section.courseCode + "-" + row.section.courseSection,
            });
          }
        }

        // Build single list with metadata
        const staff = users
          .map((u) => {
            const assignedSection = assignedByStaffId.get(u.id);

            return {
              ...u,
              assignedSection,
              flags: {
                ...u.flags,
                availableThisTerm: !assignedSection,
              },
            } as const satisfies {
              id: string;
              name: string;
              email: string;
              hours: number;
              roles: Role[];
              comments: string;
              timesAvailable: Array<{ day: Day; hour: number }>;
              preferedSections: Array<{
                rank: PreferenceLevel;
                section: {
                  id: string;
                  courseTitle: string;
                  courseCode: string;
                  courseSection: string;
                };
              }>;
              locked: boolean;
              assignedSection: { id: string; code: string } | undefined;
              flags: {
                qualifiedForThisSection: boolean;
                notAvoidedByProfessor: boolean;
                availableThisTerm: boolean;
              };
            };
          })
          .sort((a, b) => {
            // Sort so that true (available) comes before false (not available)
            if (a.assignedSection === b.assignedSection) return 0;
            return a.assignedSection ? 1 : -1;
          }) as StaffMember[];

        return { staff };
      });
    }),

  createUser: coordinatorProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        role: z.string(),
        hours: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { email, name, role, hours } = input;

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User with this email already exists",
        });
      }

      const user = await ctx.db.user.create({
        data: {
          email,
          name,
          hours,
          roles: {
            create: {
              role: role as Role,
            },
          },
        },
        include: {
          roles: true,
        },
      });

      return {
        success: true,
        message: "User created successfully",
        userId: user.id,
        user,
      };
    }),

  getAllUsers: coordinatorProcedure
    .input(z.object({ termId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const termId = input?.termId;

      const users = await ctx.db.user.findMany({
        include: {
          roles: true,
          staffPreferences: termId
            ? {
                where: { termId },
                select: { canEdit: true, id: true },
              }
            : false,
        },
        orderBy: {
          name: "asc",
        },
      });

      return {
        users: users.map((user) => {
          const staffPref = termId && user.staffPreferences?.[0];
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            hours: user.hours,
            roles: user.roles.map((r) => r.role),
            locked: staffPref ? !staffPref.canEdit : false,
            hasPreference: !!staffPref,
          };
        }),
      };
    }),

  updateUser: coordinatorProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.string().optional(),
        hours: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, name, email, role, hours } = input;

      // Check if user exists
      const existingUser = await ctx.db.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if coordinator role
      const isCoordinator = existingUser.roles.some(
        (r) => r.role === "COORDINATOR",
      );
      if (isCoordinator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot edit coordinator users",
        });
      }

      // If email is being changed, check if new email already exists
      if (email && email !== existingUser.email) {
        const emailExists = await ctx.db.user.findUnique({
          where: { email },
        });
        if (emailExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email already in use",
          });
        }
      }

      // Update user
      const updateData: {
        name?: string;
        email?: string;
        hours?: number;
      } = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (hours !== undefined) updateData.hours = hours;

      const user = await ctx.db.user.update({
        where: { id: userId },
        data: updateData,
        include: { roles: true },
      });

      // Update role if provided and different
      if (role && !existingUser.roles.some((r) => r.role === role)) {
        // Delete old roles (except COORDINATOR)
        await ctx.db.userRole.deleteMany({
          where: {
            userId,
            role: { not: "COORDINATOR" },
          },
        });

        // Create new role
        await ctx.db.userRole.create({
          data: {
            userId,
            role: role as Role,
          },
        });
      }

      return {
        success: true,
        message: "User updated successfully",
        user,
      };
    }),

  deleteUser: coordinatorProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;

      // Check if user exists and is not a coordinator
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Prevent deletion of coordinator
      const isCoordinator = user.roles.some((r) => r.role === "COORDINATOR");
      if (isCoordinator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete coordinator users",
        });
      }

      // Delete user (cascade should handle related records)
      await ctx.db.user.delete({
        where: { id: userId },
      });

      return {
        success: true,
        message: "User deleted successfully",
      };
    }),

  lockAllStaffPreferences: coordinatorProcedure
    .input(z.object({ termId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { termId } = input;

      // Lock all existing staff preferences
      const result = await ctx.db.staffPreference.updateMany({
        where: { termId },
        data: { canEdit: false },
      });

      return {
        success: true,
        message: `Locked ${result.count} staff preferences`,
        count: result.count,
      };
    }),

  unlockAllStaffPreferences: coordinatorProcedure
    .input(z.object({ termId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { termId } = input;

      // Unlock all existing staff preferences
      const result = await ctx.db.staffPreference.updateMany({
        where: { termId },
        data: { canEdit: true },
      });

      return {
        success: true,
        message: `Unlocked ${result.count} staff preferences`,
        count: result.count,
      };
    }),

  toggleUserLock: coordinatorProcedure
    .input(
      z.object({
        userId: z.string(),
        termId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, termId } = input;

      // Check if user has a staff preference for this term
      const staffPref = await ctx.db.staffPreference.findUnique({
        where: {
          userId_termId: {
            userId,
            termId,
          },
        },
        select: { id: true, canEdit: true },
      });

      if (staffPref) {
        // Toggle existing preference
        const updated = await ctx.db.staffPreference.update({
          where: { id: staffPref.id },
          data: { canEdit: !staffPref.canEdit },
          select: { id: true, canEdit: true },
        });

        return {
          success: true,
          canEdit: updated.canEdit,
          message: updated.canEdit
            ? "User unlocked - can now edit preferences"
            : "User locked - cannot edit preferences",
        };
      } else {
        // Create a locked preference for users without one
        const created = await ctx.db.staffPreference.create({
          data: {
            userId,
            termId,
            canEdit: false,
          },
          select: { id: true, canEdit: true },
        });

        return {
          success: true,
          canEdit: created.canEdit,
          message: "User locked - cannot submit preferences",
        };
      }
    }),
});
