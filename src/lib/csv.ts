import Papa from "papaparse";
import { type ZodSchema } from "zod";

export function parseCSV<T>(
  data: string,
  schema: ZodSchema<T>,
  withHeader = true,
): T {
  const res = Papa.parse(data, {
    header: withHeader,
  });
  return schema.parse(res);
}

export function safeParseCSV<T>(
  data: string,
  schema: ZodSchema<T>,
  withHeader = true,
) {
  const res = Papa.parse(data, {
    header: withHeader,
  });
  return schema.safeParse(res);
}
