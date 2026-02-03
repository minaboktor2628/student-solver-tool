import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { excelRoute } from "./routers/excel";
import { validateRoute } from "./routers/validate";
import { exportRoute } from "./routers/export";
import { assignmentRoute } from "./routers/assignment";
import { courseRoute } from "./routers/courses";
import { studentFormRoute } from "./routers/student-form";
import { staffRoute } from "./routers/staff";
import { termRoute } from "./routers/term";
import { dashboardRoute } from "./routers/dashboard";
import { userRoute } from "./routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  excel: excelRoute,
  validate: validateRoute,
  export: exportRoute,
  assignment: assignmentRoute,
  courses: courseRoute,
  studentForm: studentFormRoute,
  staff: staffRoute,
  users: userRoute,
  term: termRoute,
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
