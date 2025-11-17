import type { EditorFile } from "@/types/editor";
import * as XLSX from "xlsx";
import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import type { Assignment, Assistant } from "@/types/excel";

export const exportRoute = createTRPCRouter({
  exportSolutionToExcel: coordinatorProcedure
    .input(
      z.object({
        filename: z.string(),
        code: z.string(),
        language: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      //columns with sub objects: Course, PLAs, TAs, GLAs

      const file: EditorFile = input;
      let data: Assignment[] = [];

      const parsed: unknown = JSON.parse(file.code);

      // convert {[...]} to [...]
      if (Array.isArray(parsed)) {
        data = parsed as Assignment[];
      } else if (parsed && typeof parsed === "object") {
        const arr = Object.values(parsed).find((v) => Array.isArray(v));
        if (arr) data = arr as Assignment[];
      }
      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid allocations data format - expected {[...]} or [...]",
        );
      }

      const workbook = XLSX.utils.book_new();

      const processedData = data.map((row: Assignment) => ({
        "Academic Period": row["Academic Period"],
        Course: `${row.Section?.Course ?? ""}-${row.Section?.Subsection ?? ""} - ${row.Section?.Title ?? ""}`,
        "Meeting Pattern(s)": row["Meeting Pattern(s)"],
        Instructors: row.Instructors,
        PLAs: Array.isArray(row.PLAs)
          ? row.PLAs.map(
              (p: Partial<Assistant>) => `${p.Last}, ${p.First}`,
            ).join("; ")
          : "",
        TAs: Array.isArray(row.TAs)
          ? row.TAs.map(
              (p: Partial<Assistant>) => `${p.Last}, ${p.First}`,
            ).join("; ")
          : "",
        GLAs: Array.isArray(row.GLAs)
          ? row.GLAs.map(
              (p: Partial<Assistant>) => `${p.Last}, ${p.First}`,
            ).join("; ")
          : "",
      }));
      type ProcessedAssignment = Pick<
        Assignment,
        "Academic Period" | "Meeting Pattern(s)" | "Instructors"
      > & {
        Course: string;
        PLAs: string;
        TAs: string;
        GLAs: string;
      };

      const worksheet = XLSX.utils.json_to_sheet(processedData);
      const objectKeys = Object.keys(processedData[0] ?? {});

      //set column widths to max
      worksheet["!cols"] = objectKeys.map((key) => {
        const maxLen = Math.max(
          key.length,
          ...processedData.map((row: ProcessedAssignment) => {
            const value = row[key as keyof ProcessedAssignment];
            return value != null ? String(value).length : 0;
          }),
        );
        return { wch: maxLen + 1 };
      });

      XLSX.utils.book_append_sheet(workbook, worksheet, "Assignments");

      const workbookOut: unknown = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      return new Uint8Array(workbookOut as ArrayBuffer);
    }),
});
