import z from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";

const termInput = z.object({ termId: z.string() });

export const validatorRoute = createTRPCRouter({
  staffGotPreferences: coordinatorProcedure
    .input(termInput)
    .query(async ({ input: { termId }, ctx }) => {
      return;
    }),
});
