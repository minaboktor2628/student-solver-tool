import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import * as XLSX from "xlsx";
import {
  ExcelFileToJsonInputSchema,
  ExcelInputFiles,
  ExcelSheetNames,
  ExcelSheetSchema,
  ValidationInputSchema,
  type Assignment,
} from "@/types/excel";
import type { EditorFile } from "@/types/editor";
import { excelFileToWorkbook, sanitizeSheet, usedRange } from "@/lib/xlsx";
import { TRPCError } from "@trpc/server";
import type { ValidationStepResult } from "@/types/validation";

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
            if (res.success) return { ok: true, value: res.data };
            else return { ok: false, value: row };
          });

          const mergedRows = rowResults.map((r) => r.value);

          files.push({
            filename: baseName.data,
            language: "json",
            code: JSON.stringify(mergedRows, null, 2),
          });
        }
      }

      if (files.length !== ExcelSheetNames.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Uploaded the wrong files, or in the wrong order.",
        });

      return { files };
    }),

  validate: publicProcedure
    .input(ValidationInputSchema)
    .mutation(async ({ input }) => {
      const plaAvailableSet = new Set(
        input["PLA Preferences"]
          .filter((a) => a.Available)
          .map((a) => `${a.First} ${a.Last}`),
      );

      const taAvailableSet = new Set(
        input["TA Preferences"]
          .filter((a) => a.Available) // TAs should always be available
          .map((a) => `${a.First} ${a.Last}`),
      );

      return {
        input,
        duplicated: ensureNoDuplicates(input.Assignments),
        allAssistantsExist: ensureAssignedTAsAndPLAsAreAvailable(
          input.Assignments,
          plaAvailableSet,
          taAvailableSet,
        ),
      };
    }),
});

function ensureAssignedTAsAndPLAsAreAvailable(
  assignments: Assignment[],
  plaAvailableSet: Set<string>,
  taAvailableSet: Set<string>,
): ValidationStepResult {
  const errors: string[] = [];

  for (const assignment of assignments) {
    const courseFullName = `${assignment.Section.Course}-${assignment.Section.Subsection}`;

    for (const pla of assignment.PLAs) {
      const fullName = `${pla.First} ${pla.Last}`;
      if (!plaAvailableSet.has(fullName)) {
        errors.push(
          `PLA "${fullName}" assigned to ${courseFullName} does not exist in PLA preferences or is unavailable for this term.`,
        );
      }
    }

    for (const ta of assignment.TAs) {
      const fullName = `${ta.First} ${ta.Last}`;
      if (!taAvailableSet.has(fullName)) {
        errors.push(
          `TA "${fullName}" assigned to ${courseFullName} does not exist in TA preferences.`, // TAs should always be available
        );
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

function ensureNoDuplicates(assignments: Assignment[]): ValidationStepResult {
  const plaSet = new Set();
  const taSet = new Set();
  const glaSet = new Set();

  const errors: string[] = [];

  for (const assignment of assignments) {
    const courseFullName = `${assignment.Section.Course}-${assignment.Section.Subsection}`;

    for (const pla of assignment.PLAs) {
      const fullName = pla.First + " " + pla.Last;
      if (plaSet.has(fullName))
        errors.push(`PLAs: ${fullName} is duplicated in ${courseFullName}.`);
      else plaSet.add(fullName);
    }

    for (const gla of assignment.GLAs) {
      const fullName = gla.First + " " + gla.Last;
      if (glaSet.has(fullName))
        errors.push(`GLAs: ${fullName} is duplicated in ${courseFullName}.`);
      else glaSet.add(fullName);
    }

    for (const ta of assignment.TAs) {
      const fullName = ta.First + " " + ta.Last;
      if (taSet.has(fullName))
        errors.push(`TAs: ${fullName} is duplicated in ${courseFullName}.`);
      else taSet.add(fullName);
    }
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}
