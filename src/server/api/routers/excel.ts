import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import * as XLSX from "xlsx";
import {
  ExcelFileToJsonInputSchema,
  ExcelInputFiles,
  ExcelSheetNames,
  ExcelSheetSchema,
  ValidationInputSchema,
} from "@/types/excel";
import type { EditorFile } from "@/types/editor";
import { excelFileToWorkbook, sanitizeSheet, usedRange } from "@/lib/xlsx";

export const excelRoute = createTRPCRouter({
  parseExcelWorkbooks: publicProcedure
    .input(
      z
        .instanceof(FormData)
        .transform((fd) => Object.fromEntries(fd.entries()))
        .pipe(ExcelFileToJsonInputSchema),
    )
    .mutation(async ({ input }) => {
      const workbooks = await Promise.all(
        ExcelInputFiles.map(async (key) => {
          const wb = await excelFileToWorkbook(input[key]);
          return { workbook: wb, originalName: key };
        }),
      );

      const files: EditorFile[] = [];
      let isValid = true; // if any errors occur, set this to false

      for (const { workbook, originalName } of workbooks) {
        const sheetNames = workbook.SheetNames;
        const isSingleSheet = sheetNames.length === 1;

        for (const sheetName of sheetNames) {
          const ws = workbook.Sheets[sheetName];
          if (!ws) continue;

          // Use workbook filename if only one sheet, otherwise sheet name
          const baseName = z
            .enum(ExcelSheetNames)
            .safeParse(isSingleSheet ? originalName : sheetName);

          if (!baseName.success) continue;

          const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            ws,
            {
              raw: true,
              defval: null,
              blankrows: false,
              range: usedRange(ws),
            },
          );

          const sanitizedRows = sanitizeSheet(rawRows);

          const schemaForSheet = ExcelSheetSchema[baseName.data];
          const rowResults = sanitizedRows.map((row) => {
            const res = schemaForSheet.safeParse(row);
            if (res.success) {
              return { ok: true, value: res.data };
            } else {
              isValid = false;
              return { ok: false, value: row };
            }
          });

          const mergedRows = rowResults.map((r) => r.value);

          files.push({
            filename: baseName.data,
            language: "json",
            code: JSON.stringify(mergedRows, null, 2),
          });
        }
      }

      return { files, isValid };
    }),

  validate: publicProcedure
    .input(ValidationInputSchema)
    .mutation(async ({ input }) => {
      return input; // TODO:
    }),
});
