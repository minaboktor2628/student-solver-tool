import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import * as XLSX from "xlsx";
import {
  ExcelFileToJsonInputSchema,
  ExcelInputFiles,
  ExcelSheetSchema,
  type AllocationWithoutAssistants,
  type Assignment,
} from "@/types/excel";
import type { EditorFile } from "@/types/editor";
import { excelFileToWorkbook, sanitizeSheet, usedRange } from "@/lib/xlsx";
import { mergeAllocationsAndAssignments } from "@/lib/validation";

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

      // hold these to merge later
      let allocationsRows: AllocationWithoutAssistants[] | null = null;
      let assignmentsRows: Assignment[] | null = null;

      for (const { workbook, originalName } of workbooks) {
        const sheetNames = workbook.SheetNames;
        const isSingleSheet = sheetNames.length === 1;

        for (const sheetName of sheetNames) {
          const ws = workbook.Sheets[sheetName];
          if (!ws) continue;

          const baseName = z
            .enum([
              "TAs Preferences",
              "PLAs Preferences",
              "Assignments",
              "Allocations",
            ])
            .safeParse(isSingleSheet ? originalName : sheetName); // Use workbook filename if only one sheet, otherwise sheet name

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
            if (res.success) return { ok: true, value: res.data };
            else return { ok: false, value: row };
          });

          const mergedRows = rowResults.map((r) => r.value);

          // capture Allocations / Assignments and don't emit yet
          if (baseName.data === "Allocations") {
            allocationsRows = mergedRows as AllocationWithoutAssistants[];
            continue;
          }
          if (baseName.data === "Assignments") {
            assignmentsRows = mergedRows as Assignment[];
            continue;
          }

          // only push preference files here
          files.push({
            filename: baseName.data,
            language: "json",
            code: JSON.stringify(mergedRows, null, 2),
          });
        }
      }

      if (allocationsRows) {
        const merged = mergeAllocationsAndAssignments(
          allocationsRows,
          assignmentsRows ?? [], // if no assignments passed in, default as empty array
        );
        files.push({
          filename: "Allocations",
          language: "json",
          code: JSON.stringify(merged, null, 2),
        });
      }

      return { files };
    }),
});
