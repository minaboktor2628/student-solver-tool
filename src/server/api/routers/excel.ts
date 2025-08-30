import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import * as XLSX from "xlsx";
import {
  ExcelFileToJsonInputSchema,
  ExcelInputFiles,
  ExcelSheetNames,
  ExcelSheetSchema,
} from "@/types/excel";
import type { EditorFile } from "@/types/editor";
import { excelFileToWorkbook, sanitizeSheet, usedRange } from "@/lib/xlsx";

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

          const rawRows = XLSX.utils.sheet_to_json(ws, {
            raw: true,
            defval: null,
            blankrows: false,
            range: usedRange(ws),
          });

          const sanitizedRows = sanitizeSheet(
            rawRows as Record<string, unknown>[],
          );

          const schemaForSheet = ExcelSheetSchema[baseName.data];
          const parsed = schemaForSheet.array().safeParse(sanitizedRows);

          if (!parsed.success) console.error(parsed.error);
          files.push({
            filename: `/${baseName.data}.json`,
            language: "json",
            code: JSON.stringify(
              parsed.success ? parsed.data : sanitizedRows,
              null,
              2,
            ),
          });
        }
      }

      return files;
    }),
});
