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
import type { ValidationResult } from "@/types/validation";
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
      const t0 = performance.now();
      const workbooks = await Promise.all(
        ExcelInputFiles.map(async (key) => {
          const wb = await excelFileToWorkbook(input[key]);
          return { workbook: wb, originalName: key };
        }),
      );

      const files: EditorFile[] = [];
      const parseErrors: string[] = [];
      const parseWarnings: string[] = [];
      let totalRowsParsed = 0;
      let totalRowsWithErrors = 0;

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
              "TA Preferences",
              "PLA Preferences",
              "Assignments",
              "Allocations",
            ])
            .safeParse(isSingleSheet ? originalName : sheetName);

          if (!baseName.success) {
            parseWarnings.push(
              `Skipped sheet "${sheetName}" in ${originalName} - not a recognized sheet name.`
            );
            continue;
          }

          const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            ws,
            {
              raw: true,
              defval: null,
              blankrows: false,
              range: usedRange(ws),
            },
          );

          if (rawRows.length === 0) {
            parseWarnings.push(`Sheet "${baseName.data}" is empty.`);
            continue;
          }

          const sanitizedRows = sanitizeSheet(rawRows);
          totalRowsParsed += sanitizedRows.length;

          const schemaForSheet = ExcelSheetSchema[baseName.data];
          const rowResults = sanitizedRows.map((row, index) => {
            const res = schemaForSheet.safeParse(row);
            if (res.success) {
              return { ok: true as const, value: res.data };
            } else {
              const rowNum = index + 2; // +2 because Excel is 1-indexed and we skip header
              const errorDetails = res.error.issues
                .map(issue => `${issue.path.join('.') || 'row'}: ${issue.message}`)
                .join('; ');
              parseErrors.push(
                `${baseName.data} row ${rowNum}: ${errorDetails}`
              );
              return { ok: false as const, value: row };
            }
          });

          // Keep ALL rows (both valid and invalid) for the JSON editor
          const allRows = rowResults.map(r => r.value);
          const rowErrorCount = rowResults.filter(r => !r.ok).length;
          totalRowsWithErrors += rowErrorCount;

          if (rowErrorCount > 0) {
            parseWarnings.push(
              `${baseName.data}: ${rowErrorCount} out of ${sanitizedRows.length} rows had validation errors.`
            );
          }

          // capture Allocations / Assignments and don't emit yet
          // For merging, we need only valid rows, but for display we keep all
          if (baseName.data === "Allocations") {
            allocationsRows = rowResults
              .filter(r => r.ok)
              .map(r => r.value) as AllocationWithoutAssistants[];
            // Still push to files for editor display (with invalid rows)
            files.push({
              filename: baseName.data,
              language: "json", 
              code: JSON.stringify(allRows, null, 2),
            });
            continue;
          }
          if (baseName.data === "Assignments") {
            assignmentsRows = rowResults
              .filter(r => r.ok)
              .map(r => r.value) as Assignment[];
            // Still push to files for editor display (with invalid rows)
            files.push({
              filename: baseName.data,
              language: "json",
              code: JSON.stringify(allRows, null, 2),
            });
            continue;
          }

          // preference files - keep all rows including invalid ones
          files.push({
            filename: baseName.data,
            language: "json",
            code: JSON.stringify(allRows, null, 2),
          });
        }
      }

      // Merge allocations and assignments if we have allocations
      // Note: We already added Allocations to files above, but we need to create
      // a merged version as well for the final Allocations file
      if (allocationsRows) {
        try {
          const merged = mergeAllocationsAndAssignments(
            allocationsRows,
            assignmentsRows ?? [],
          );
          
          // Replace the Allocations file with the merged version
          const allocationsIndex = files.findIndex(f => f.filename === "Allocations");
          if (allocationsIndex >= 0) {
            files[allocationsIndex] = {
              filename: "Allocations",
              language: "json",
              code: JSON.stringify(merged, null, 2),
            };
          } else {
            files.push({
              filename: "Allocations", 
              language: "json",
              code: JSON.stringify(merged, null, 2),
            });
          }
        } catch (error) {
          parseErrors.push(
            `Failed to merge Allocations and Assignments: ${String(error)}`
          );
        }
      }

      // Create parse result
      const parseResult: ValidationResult = {
        ok: parseErrors.length === 0,
        errors: parseErrors,
        warnings: parseWarnings,
        meta: {
          ms: Math.round(performance.now() - t0),
          rule: `Excel parsing completed. ${totalRowsParsed} total rows processed, ${totalRowsWithErrors} rows with errors.`,
        },
      };

      return { files, parseResult };
    }),
});