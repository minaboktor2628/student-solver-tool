"use client";
import { api } from "@/trpc/react";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { createColumns, type TermRow } from "./columns";

// TODO: make this paginated
export function TermTable() {
  const [termStats] = api.term.getTermStats.useSuspenseQuery();

  const columns = createColumns();

  const rows: TermRow[] = (termStats ?? []).map((t) => ({
    ...(t as Omit<TermRow, "name">),
    name: `${t.termLetter} ${t.year}`,
  }));

  return (
    <Card>
      <CardContent>
        <DataTable
          columns={columns}
          data={rows}
          toolbarProps={{
            searchColumnId: "name",
            searchPlaceholder: "Filter terms...",
          }}
        />
      </CardContent>
    </Card>
  );
}
