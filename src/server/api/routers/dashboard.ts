import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { notNullFilter } from "@/lib/utils";

export const dashboardRoute = createTRPCRouter({
  getAssignments: coordinatorProcedure
    .input(z.object({ termId: z.string() }))
    .query(async ({ ctx, input: { termId } }) => {
      const sections = await ctx.db.section.findMany({
        where: { termId },
        include: {
          professor: { select: { name: true, email: true } },
          assignments: {
            select: {
              staff: { select: { name: true, email: true, roles: true } },
            },
          },
        },
      });

      const allEmailsSet = new Set<string>();

      const mappedSections = sections.map(
        ({
          professor,
          assignments,
          meetingPattern,
          academicLevel,
          courseTitle,
          courseCode,
          courseSection,
        }) => {
          const staffList = assignments
            .map((a) => a.staff)
            .filter(notNullFilter)
            .map((s) => ({
              email: s.email,
              name: s.name,
              roles: s.roles.map((r) => r.role),
            }));

          const plas = staffList.filter((s) => s.roles.includes("PLA"));
          const tas = staffList.filter((s) => s.roles.includes("TA"));

          const staffEmails = staffList
            .map((s) => s.email)
            .filter(notNullFilter);

          const sectionEmails = [
            ...staffEmails,
            ...(professor?.email ? [professor.email] : []),
          ];

          // Add to global set
          sectionEmails.forEach((email) => allEmailsSet.add(email));

          return {
            title: `${courseCode}-${courseSection} - ${courseTitle}`,
            professor: professor?.name ?? null,
            meetingPattern,
            academicLevel,
            plas: plas.map((p) => p.name),
            tas: tas.map((p) => p.name),
            // if you want them per section in the future
            // emails: sectionEmails,
          };
        },
      );

      const allEmails = Array.from(allEmailsSet);

      return {
        sections: mappedSections,
        allEmails,
      };
    }),
  solverAlertInfo: coordinatorProcedure
    .input(z.object({ termId: z.string() }))
    .query(async ({ ctx, input: { termId } }) => {
      const now = new Date();

      const [term, staffEditableCount, professorEditableCount] =
        await ctx.db.$transaction([
          ctx.db.term.findUnique({
            where: { id: termId },
            select: {
              termProfessorDueDate: true,
              termStaffDueDate: true,
            },
          }),

          ctx.db.staffPreference.count({
            where: {
              termId,
              user: {
                canEditForm: true,
              },
            },
          }),

          ctx.db.professorPreference.count({
            where: {
              section: {
                termId,
                professor: {
                  canEditForm: true,
                },
              },
            },
          }),
        ]);

      if (!term) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This term does not exist.",
        });
      }

      return {
        staffEditableCount,
        professorEditableCount,
        termDueDates: {
          staff: {
            date: term.termStaffDueDate,
            isPastDueDate: now >= term.termStaffDueDate,
          },
          professor: {
            date: term.termProfessorDueDate,
            isPastDueDate: now >= term.termProfessorDueDate,
          },
        },
      };
    }),

  getDashboardData: coordinatorProcedure
    .input(z.object({ termId: z.string() }))
    .query(async ({ input: { termId }, ctx }) => {
      const term = await ctx.db.term.findUnique({
        where: { id: termId },
      });

      if (!term) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Term not found",
        });
      }

      // Fetch sections for staffingGap calculation
      const sections = await ctx.db.section.findMany({
        where: { termId },
        include: {
          assignments: {
            include: {
              staff: true, // need staff.hours
            },
          },
        },
      });

      // Compute staffingGap
      const staffingGap = sections.reduce((sum, section) => {
        const assignedHours = section.assignments.reduce(
          (acc, assignment) => acc + (assignment.staff?.hours ?? 0),
          0,
        );
        const required = section.requiredHours ?? 0;
        return sum + Math.max(0, required - assignedHours);
      }, 0);

      // Fetch all staff with their preferences for this term
      const staffUsers = await ctx.db.user.findMany({
        where: {
          roles: { some: { role: { in: ["PLA", "TA"] } } },
        },
        include: {
          roles: true,
          staffPreferences: {
            where: { termId },
            include: { timesAvailable: true },
          },
        },
      });

      // Transform staff users into a flat shape
      const staff = staffUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        hours: user.hours ?? 0,
        roles: user.roles.map((r) => r.role),
        staffPreferences: user.staffPreferences,
        hasPreferences: user.staffPreferences.length > 0,
      }));

      const submittedStaff = staff.filter((s) => s.hasPreferences);
      const pendingStaff = staff.filter((s) => !s.hasPreferences);

      const staffTotalCount = staff.length;
      const staffSubmittedCount = submittedStaff.length;
      const staffSubmissionRate =
        staffTotalCount > 0
          ? Math.round((staffSubmittedCount / staffTotalCount) * 100)
          : 0;

      // Compute total available hours using role based increments per submission.
      // TA submissions add 20, PLA submissions add 10
      // Compute total available hours from each submitted user's hours field.
      const totalAvailableHours = submittedStaff.reduce(
        (sum, s) => sum + s.hours,
        0,
      );

      const roleStats: Record<
        "TA" | "PLA",
        { pending: number; submitted: number }
      > = {
        [Role.PLA]: { pending: 0, submitted: 0 },
        [Role.TA]: { pending: 0, submitted: 0 },
      };

      (["PLA", "TA"] as const).forEach((role) => {
        roleStats[role].pending = pendingStaff.filter((s) =>
          s.roles.includes(role),
        ).length;
        roleStats[role].submitted = submittedStaff.filter((s) =>
          s.roles.includes(role),
        ).length;
      });

      // Only send pending staff with the fields the UI actually uses
      const pendingStaffLite = pendingStaff.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        roles: s.roles,
      }));

      // Fetch all professors with courses & preferences
      const professorUsers = await ctx.db.user.findMany({
        where: { roles: { some: { role: "PROFESSOR" } } },
        include: {
          teaches: {
            where: { termId },
            include: { professorPreference: true },
          },
        },
      });

      const professorData = professorUsers
        .filter((p) => p.teaches.length > 0)
        .map((p) => {
          const courseCount = p.teaches.length;
          const hasPreferences = p.teaches.some(
            (t) => t.professorPreference != null,
          );
          return {
            id: p.id,
            name: p.name,
            email: p.email,
            courseCount,
            hasPreferences,
          };
        });

      const submittedProfessors = professorData.filter((p) => p.hasPreferences);
      const pendingProfessors = professorData.filter((p) => !p.hasPreferences);

      const profTotalCount = professorData.length;
      const profSubmittedCount = submittedProfessors.length;
      const profSubmissionRate =
        profTotalCount > 0
          ? Math.round((profSubmittedCount / profTotalCount) * 100)
          : 0;

      const pendingProfessorsCourseCount = pendingProfessors.reduce(
        (sum, p) => sum + p.courseCount,
        0,
      );
      const submittedProfessorsCourseCount = submittedProfessors.reduce(
        (sum, p) => sum + p.courseCount,
        0,
      );

      const pendingProfessorsLite = pendingProfessors.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        courseCount: p.courseCount,
      }));

      return {
        currentTerm: `${term.termLetter} ${term.year}`,
        termId,
        staffingGap,
        staff: {
          totalCount: staffTotalCount,
          submittedCount: staffSubmittedCount,
          submissionRate: staffSubmissionRate,
          totalAvailableHours,
          roleStats, // { PLA: {pending, submitted}, TA: {...} }
          pending: pendingStaffLite,
        },
        professors: {
          totalCount: profTotalCount,
          submittedCount: profSubmittedCount,
          submissionRate: profSubmissionRate,
          pendingCourseCount: pendingProfessorsCourseCount,
          submittedCourseCount: submittedProfessorsCourseCount,
          pending: pendingProfessorsLite,
        },
      };
    }),
});
