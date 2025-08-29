import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import * as XLSX from "xlsx";
import { ExcelFileToJsonInputSchema, ExcelInputFiles } from "@/types/excel";
import { toSafeFilename } from "@/lib/utils";
import type { EditorFile } from "@/types/editor";
import { excelFileToWorkbook, usedRange } from "@/lib/xlsx";

export const excelRoute = createTRPCRouter({
  toJson: publicProcedure
    .input(
      z
        .instanceof(FormData)
        .transform((fd) => Object.fromEntries(fd.entries()))
        .pipe(ExcelFileToJsonInputSchema),
    )
    .mutation<EditorFile[]>(async ({ input }) => {
      const workbooks = await Promise.all(
        ExcelInputFiles.map(async (key) => {
          const wb = await excelFileToWorkbook(input[key]);
          return { workbook: wb, originalName: key };
        }),
      );

      const files: EditorFile[] = [];
      const workbookJson: Record<string, unknown[]> = {};

      for (const { workbook, originalName } of workbooks) {
        const sheetNames = workbook.SheetNames;
        const isSingleSheet = sheetNames.length === 1;

        for (const sheetName of sheetNames) {
          const ws = workbook.Sheets[sheetName];
          if (!ws) continue;

          const rows = XLSX.utils.sheet_to_json(ws, {
            raw: true,
            defval: null,
            blankrows: false,
            range: usedRange(ws),
          });

          // Use workbook filename if only one sheet, otherwise sheet name
          const baseName = isSingleSheet ? originalName : sheetName;

          workbookJson[baseName] = rows;

          files.push({
            filename: `/${toSafeFilename(baseName)}.json`,
            code: JSON.stringify(rows, null, 2),
            language: "json",
          });
        }
      }

      files.push({
        filename: `/ALL.json`,
        code: JSON.stringify(workbookJson, null, 2),
        language: "json",
      });

      if (files.length === 0) {
        files.push({
          filename: "/data.json",
          code: '{ "message": "No data found in workbook." }',
          language: "json",
        });
      }

      return files;
    }),

  validate: publicProcedure.mutation(() => "validating"),
});
