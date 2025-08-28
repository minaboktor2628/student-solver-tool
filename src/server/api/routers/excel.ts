import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import * as XLSX from "xlsx";
import { ExcelFileSchema } from "@/types/excel";
import { toSafeFilename } from "@/lib/utils";
import type { EditorFile } from "@/types/editor";

export const excelRoute = createTRPCRouter({
  toJson: publicProcedure
    .input(
      z
        .instanceof(FormData)
        .transform((fd) => Object.fromEntries(fd.entries()))
        .pipe(
          z.object({
            file: ExcelFileSchema,
          }),
        ),
    )
    .mutation<EditorFile[]>(async ({ input }) => {
      const arrayBuffer = await input.file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

      const files: EditorFile[] = [];

      for (const sheetName of workbook.SheetNames) {
        const ws = workbook.Sheets[sheetName];
        if (!ws) continue;

        const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
        files.push({
          filename: `/${toSafeFilename(sheetName)}.json`,
          code: JSON.stringify(rows, null, 2),
          language: "json",
        });
      }

      if (files.length === 0) {
        files.push({
          filename: "/data.json",
          code: '{ message: "No data found in workbook." }',
          language: "json",
        });
      }

      return files;
    }),

  validate: publicProcedure.mutation(() => "validating"),
});
