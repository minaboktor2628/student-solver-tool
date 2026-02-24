import { humanizeKey } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

/**
 * Creates default TanStack columns from the first row of data.
 *
 * - Uses accessorKey
 * - Auto-generates readable headers
 * - Handles primitive values safely
 */
export function createDefaultColumns<TData extends object>(
  data: TData[],
): ColumnDef<TData, unknown>[] {
  if (!data?.length) return [];

  const firstRow = data[0] as Record<string, unknown>;

  return Object.keys(firstRow).map((key) => ({
    accessorKey: key,
    header: humanizeKey(key),
    cell: ({ getValue }) => {
      const value = getValue();

      if (value == null || !value) return "";

      // If object/array, stringify for display
      if (typeof value === "object") {
        return JSON.stringify(value);
      }

      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return String(value);
    },
  }));
}
