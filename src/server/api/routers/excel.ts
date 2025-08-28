import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import * as XLSX from "xlsx";
import { ExcelFileSchema } from "@/types/excel";
import { toSafeFilename } from "@/lib/utils";
import type { EditorFile } from "@/types/editor";

async function fileToWorkbook(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  return workbook;
}

export const excelRoute = createTRPCRouter({
  toJson: publicProcedure
    .input(
      z
        .instanceof(FormData)
        .transform((fd) => Object.fromEntries(fd.entries()))
        .pipe(
          z.object({
            assignements: ExcelFileSchema,
            pla: ExcelFileSchema,
            ta: ExcelFileSchema,
          }),
        ),
    )
    .mutation<EditorFile[]>(async ({ input }) => {
      const workbooks = await Promise.all(
        [input.pla, input.ta, input.assignements].map(fileToWorkbook),
      );

      const files: EditorFile[] = [];

      for (const workbook of workbooks) {
        for (const sheetName of workbook.SheetNames) {
          const ws = workbook.Sheets[sheetName];
          if (!ws) continue;

          const rows = XLSX.utils.sheet_to_json(ws, {
            defval: null,
            raw: true,
          });

          files.push({
            filename: `/${toSafeFilename(sheetName)}.json`,
            code: JSON.stringify(rows, null, 2),
            language: "json",
          });
        }
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
