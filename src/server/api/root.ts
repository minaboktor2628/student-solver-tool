import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { excelRoute } from "./routers/excel";
import { validateRoute } from "./routers/validate";
import { exportRoute } from "./routers/export";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  excel: excelRoute,
  validate: validateRoute,
  export: exportRoute,
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
