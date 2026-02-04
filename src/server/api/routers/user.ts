import z from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { defaultPLAHours, defaultTAHours } from "@/lib/constants";
import { Role } from "@prisma/client";

export const userRoute = createTRPCRouter({
  createUsers: coordinatorProcedure
    .input(
      z.object({
        users: z.array(
          z.object({
            name: z.string(),
            email: z.string().email(),
            role: z.nativeEnum(Role),
          }),
        ),
        termId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: { users, termId } }) => {
      // NOTE: This has to be a transaction because we create the roles here, which is not allowed in a user.createMany() invocation
      const result = await ctx.db.$transaction(
        users.map(({ role, name, email }) =>
          ctx.db.user.create({
            data: {
              name,
              email,
              hours:
                role === "TA"
                  ? defaultTAHours()
                  : role === "PLA"
                    ? defaultPLAHours()
                    : 0,
              roles: {
                create: { role },
              },
            },
          }),
        ),
      );

      await ctx.db.allowedTermUser.createMany({
        data: result.map(({ id }) => ({ userId: id, termId })),
      });

      return result;
    }),
});
