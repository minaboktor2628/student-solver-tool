import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import * as XLSX from "xlsx";
import { isExcelName, isExcelType } from "@/lib/utils";

export const excelRoute = createTRPCRouter({
  validate: publicProcedure
    .input(
      z
        .instanceof(FormData)
        .transform((fd) => Object.fromEntries(fd.entries()))
        .pipe(
          z.object({
            file: z
              .instanceof(File)
              .refine((f) => f.size > 0, "File must not be empty.")
              .refine(
                (f) => isExcelType(f.type) || isExcelName(f.name),
                "File must be .xlsx or .xls",
              ),
          }),
        ),
    )
    .mutation(async ({ input }) => {
      const arrayBuffer = await input.file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: "buffer" });

      const allSheets: Record<string, unknown[]> = {};
      for (const sheetName of workbook.SheetNames) {
        const ws = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
        allSheets[sheetName] = rows;
      }

      return { allSheets };
    }),
});
