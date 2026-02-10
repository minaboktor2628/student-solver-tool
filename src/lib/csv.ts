import Papa from "papaparse";
import { ZodSchema } from "zod";

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
