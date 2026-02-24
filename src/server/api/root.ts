import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { professorFormRoute } from "./routers/professor-form";
import { professorDashboardRoute } from "./routers/professor-dashboard";
import { assignmentRoute } from "./routers/assignment";
import { courseRoute } from "./routers/courses";
import { studentFormRoute } from "./routers/student-form";
import { studentDashboardRoute } from "./routers/student-dashboard";
import { staffRoute } from "./routers/staff";
import { termRoute } from "./routers/term";
import { dashboardRoute } from "./routers/dashboard";
import { userRoute } from "./routers/users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  professorForm: professorFormRoute,
  professorDashboard: professorDashboardRoute,
  assignment: assignmentRoute,
  courses: courseRoute,
  studentForm: studentFormRoute,
  studentDashboard: studentDashboardRoute,
  staff: staffRoute,
  term: termRoute,
  user: userRoute,
  dashboard: dashboardRoute,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
