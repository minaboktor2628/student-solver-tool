import { coordinatorProcedure, createTRPCRouter } from "../trpc";

export const userRoute = createTRPCRouter({
  getAllProfessors: coordinatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      where: {
        roles: { some: { role: { equals: "PROFESSOR" } } },
      },
    });
  }),
});
