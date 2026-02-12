/**
 * CSV parsing utilities with optional deduplication and Zod validation.
 *
 * This module provides two helpers:
 *
 *  - `parseCSV`     → Parses CSV text and validates it with a Zod *row schema*.
 *                     Throws if validation fails.
 *
 *  - `safeParseCSV` → Same as `parseCSV`, but returns Zod's SafeParseResult
 *                     instead of throwing.
 *
 * Features:
 *  - Uses PapaParse to parse CSV strings.
 *  - Forces `header: true` (first row treated as column names → rows are objects).
 *  - Automatically skips empty lines.
 *  - Optional row deduplication via `dedupeBy` (first occurrence wins).
 *
 * Example:
 *
 *   const RowSchema = z.object({
 *     id: z.string(),
 *     email: z.string().email(),
 *   });
 *
 *   const rows = parseCSV(csvString, RowSchema, {
 *     dedupeBy: (row) => row.email,
 *   });
 *
 * Notes:
 *  - You pass a schema for a single row; this module validates an array of rows
 *    by wrapping it as `z.array(rowSchema)`.
 *  - PapaParse parsing errors are not automatically thrown; only schema
 *    validation errors are enforced by `parseCSV`.
 */

import Papa from "papaparse";
import { z, type ZodSchema } from "zod";

type CSVOptions<Row> = {
  dedupeBy?: (row: Row) => string | number;
};

function prepareRows<T>(data: string, options?: CSVOptions<T>): unknown[] {
  const res = Papa.parse(data, {
    header: true,
    skipEmptyLines: true,
  });

  let rows = res.data;

  const dedupeBy = options?.dedupeBy;
  if (dedupeBy) {
    const seen = new Set<string | number>();
    rows = (rows as T[]).filter((row) => {
      const key = dedupeBy(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return rows;
}

/**
 * Parse a CSV string into an array of typed row objects and validate with Zod.
 *
 * - Parses using PapaParse with `header: true` (first row is column names).
 * - Skips empty lines.
 * - Optionally deduplicates rows using `options.dedupeBy` (first occurrence wins).
 *
 * @param data CSV text
 * @param rowSchema Zod schema for a *single row object* (this function validates an array of rows)
 * @param options Optional settings (e.g., dedupeBy)
 * @returns An array of validated rows (`Row[]`)
 * @throws ZodError if validation fails
 *
 * @example
 * const RowSchema = z.object({ id: z.string(), email: z.string().email() });
 * const rows = parseCSV(csvText, RowSchema, { dedupeBy: (r) => r.email });
 */
export function parseCSV<Row>(
  data: string,
  rowSchema: ZodSchema<Row>,
  options?: CSVOptions<Row>,
): Row[] {
  const rows = prepareRows<Row>(data, options);
  return z.array(rowSchema).parse(rows);
}

/**
 * Safe version of `parseCSV`.
 *
 * Same behavior, but returns Zod's SafeParseResult instead of throwing.
 *
 * @param data CSV text
 * @param rowSchema Zod schema for a *single row object* (this function validates an array of rows)
 * @param options Optional settings (e.g., dedupeBy)
 * @returns SafeParseResult with `data: Row[]` on success, or `error` on failure
 *
 * @example
 * const result = safeParseCSV(csvText, RowSchema);
 * if (!result.success) console.error(result.error.format());
 */
export function safeParseCSV<Row>(
  data: string,
  rowSchema: ZodSchema<Row>,
  options?: CSVOptions<Row>,
) {
  const rows = prepareRows<Row>(data, options);
  return z.array(rowSchema).safeParse(rows);
}
