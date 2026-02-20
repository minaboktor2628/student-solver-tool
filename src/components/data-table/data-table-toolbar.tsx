"use client";

import { type Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import type { ReactNode } from "react";

export type FacetOption = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
};

// Make this generic over the column id type
export type FacetedFilterConfig<TColumnId extends string = string> = {
  /** Table column id */
  columnId: TColumnId;
  /** Filter label */
  title: string;
  /** Options passed to DataTableFacetedFilter */
  options: FacetOption[];
};

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;

  /** Column id used for the text search input (default: "title") */
  searchColumnIds?: (keyof TData & string)[];

  /** Placeholder for the search input */
  searchPlaceholder?: string;

  /** Faceted filter configuration (status, priority, etc.) */
  facetedFilters?: FacetedFilterConfig<keyof TData & string>[];

  /* optional action button */
  actionButtonSlot?: ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchColumnIds,
  searchPlaceholder = "Filter...",
  facetedFilters = [],
  actionButtonSlot,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const searchColumns =
    searchColumnIds
      ?.map((id) => table.getColumn(id))
      .filter((col): col is NonNullable<typeof col> => !!col) ?? [];

  const searchValue =
    (searchColumns[0]?.getFilterValue() as string | undefined) ?? "";

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        {searchColumns.length > 0 && (
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => {
              const value = event.target.value;
              searchColumns.forEach((column) => {
                column.setFilterValue(value);
              });
            }}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}

        {facetedFilters.map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column) return null;

          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
          >
            Reset <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
        {actionButtonSlot}
      </div>
    </div>
  );
}
