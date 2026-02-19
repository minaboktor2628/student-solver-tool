"use client";

/*
 * this provides default data table cols if caller does not want custom ones
 * */

import type { ColumnDef } from "@tanstack/react-table";
import { capitalizeFirstLetter } from "@/lib/utils";
import type { ZodObject, ZodRawShape, z } from "zod";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
// takes in any zod object and returns deault cols
export function makeDefaultZodCols<T extends ZodRawShape>(
  schema: ZodObject<T>,
): ColumnDef<z.infer<ZodObject<T>>>[] {
  const keys = schema.keyof().options as Array<keyof T>;
  return keys.map((key) => ({
    header: capitalizeFirstLetter(key as string),
    accessorKey: key as string,
  }));
}

export function makeDefaultZodColsNew<T extends ZodRawShape>(
  schema: ZodObject<T>,
): ColumnDef<z.infer<ZodObject<T>>>[] {
  const keys = schema.keyof().options as Array<keyof T>;

  return keys.map((key) => {
    if ((key as string) == "bleu") {
      return {
        header: () => {
          return (
            <>
              <HoverCard>
                <div>
                  Bleu
                  <HoverCardTrigger
                    style={{ width: 0, height: 0, padding: 0 }}
                    className="hover: ml-2 cursor-pointer rounded-3xl border-8 font-serif font-extrabold"
                  >
                    i
                  </HoverCardTrigger>
                </div>
                <HoverCardContent>
                  <p>
                    Measurement of the difference between an automatic
                    translation and human-created reference translations of the
                    same source sentence. The bigger this value is the better
                    the model is.
                  </p>
                </HoverCardContent>
              </HoverCard>
            </>
          );
        },
        accessorKey: key as string,
      };
    } else if (key.toString() == "rouge") {
      return {
        header: () => {
          return (
            <>
              <HoverCard>
                <div>
                  Rouge
                  <HoverCardTrigger
                    style={{ width: 0, height: 0, padding: 0 }}
                    className="hover: ml-2 cursor-pointer rounded-3xl border-8 font-serif font-extrabold"
                  >
                    i
                  </HoverCardTrigger>
                </div>

                <HoverCardContent>
                  <p>
                    Compare an automatically produced summary or translation
                    against a reference or a set of references (human-produced)
                    summary or translation. ROUGE metrics range between 0 and 1,
                    with higher scores indicating higher similarity.
                  </p>
                </HoverCardContent>
              </HoverCard>
            </>
          );
        },
        accessorKey: key as string,
      };
    } else if (key.toString() == "meteor") {
      return {
        header: () => {
          return (
            <>
              <HoverCard>
                <div>
                  Meteor
                  <HoverCardTrigger
                    style={{ width: 0, height: 0, padding: 0 }}
                    className="hover: ml-2 cursor-pointer rounded-3xl border-8 font-serif font-extrabold"
                  >
                    i
                  </HoverCardTrigger>
                </div>

                <HoverCardContent>
                  <p>
                    Evaluation metric for machine translation that improves over
                    traditional metrics like BLEU by incorporating linguistic
                    features such as synonymy, stemming, and word order, and
                    placing more emphasis on recall to better align with human
                    judgments of translation quality. The bigger the better.
                  </p>
                </HoverCardContent>
              </HoverCard>
            </>
          );
        },
        accessorKey: key as string,
      };
    } else {
      return {
        header: capitalizeFirstLetter(key as string),
        accessorKey: key as string,
      };
    }
  });
}
