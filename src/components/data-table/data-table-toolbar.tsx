"use client";

import { type Row, type Table } from "@tanstack/react-table";
import { DownloadIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import type { ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadTemplateCSV } from "@/lib/download-file";

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

  /** Column id used for the text search input */
  searchColumnId?: keyof TData & string;

  /** Placeholder for the search input */
  searchPlaceholder?: string;

  /** Faceted filter configuration (status, priority, etc.) */
  facetedFilters?: FacetedFilterConfig<
    (keyof TData & string) | (string & {})
  >[];

  /* optional action button */
  children?: ReactNode;

  /* if true, will display a download csv button */
  // on cols that you dont want to export, make sure you have this one them -> meta: { export: false },
  exportButton?: boolean;
}

export function DataTableToolbar<TData>({
  table,
  searchColumnId,
  searchPlaceholder = "Filter...",
  facetedFilters = [],
  children,
  exportButton = true,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const searchColumn = searchColumnId
    ? table.getColumn(searchColumnId)
    : undefined;

  const searchValue =
    (searchColumn?.getFilterValue() as string | undefined) ?? "";

  const buildCsvData = (
    rows: Row<TData>[],
  ): { headers: string[]; data: Record<string, unknown>[] } => {
    const columnsToExclude = new Set(["select", "actions"]);

    const visibleColumns = table
      .getAllLeafColumns()
      .filter((col) => col.getIsVisible() && !columnsToExclude.has(col.id))
      .filter((col) => {
        const shouldExport = (
          col.columnDef.meta as { export?: boolean } | undefined
        )?.export;
        return col.getIsVisible() && shouldExport !== false;
      });

    const headersMeta = visibleColumns.map((col) => ({
      id: col.id,
      label:
        typeof col.columnDef.header === "string"
          ? col.columnDef.header
          : col.id,
    }));

    const data = rows.map((row) =>
      headersMeta.reduce<Record<string, unknown>>((acc, header) => {
        acc[header.label] = row.getValue(header.id);
        return acc;
      }, {}),
    );

    return {
      headers: headersMeta.map((h) => h.label),
      data,
    };
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        {searchColumn && (
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => {
              const value = event.target.value;
              searchColumn.setFilterValue(value);
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
        {exportButton && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="Download table">
                <DownloadIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Download options (CSV)</DropdownMenuLabel>
                <DropdownMenuItem
                  disabled={table.getFilteredRowModel().rows.length === 0}
                  onClick={() => {
                    const { headers, data } = buildCsvData(
                      table.getFilteredRowModel().rows,
                    );

                    downloadTemplateCSV(headers, data, "all-filtered-rows.csv");
                  }}
                >
                  All filtered rows ({table.getFilteredRowModel().rows.length})
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={table.getSelectedRowModel().rows.length === 0}
                  onClick={() => {
                    const { headers, data } = buildCsvData(
                      table.getSelectedRowModel().rows,
                    );

                    downloadTemplateCSV(headers, data, "selected-rows.csv");
                  }}
                >
                  Only selected ({table.getSelectedRowModel().rows.length})
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {children}
      </div>
    </div>
  );
}
