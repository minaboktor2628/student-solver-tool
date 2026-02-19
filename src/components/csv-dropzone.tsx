"use client";
import { toast } from "sonner";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { safeParseCSV } from "@/lib/csv";
import { z } from "zod";
import { Button } from "./ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { DownloadIcon } from "lucide-react";
import {
  humanizeKey,
  valToSafeString,
  zodTypeHumanReadableLabel,
} from "@/lib/utils";
import { downloadTemplateCSV } from "@/lib/download-file";
import { Separator } from "./ui/separator";

type AnyZodObject = z.ZodObject<z.ZodRawShape>;

export type CSVDropzoneProps<Schema extends AnyZodObject> = {
  schema: Schema;
  onSubmit: (rows: Array<z.infer<Schema>>) => void;
  disabled?: boolean;
  dedupeBy?: (row: z.infer<Schema>) => string | number;
  exampleRow?: Partial<z.infer<Schema>>;
};

export function CSVDropzone<Schema extends AnyZodObject>({
  schema,
  onSubmit,
  dedupeBy,
  disabled = false,
  exampleRow,
}: CSVDropzoneProps<Schema>) {
  type Row = z.infer<Schema>;

  const [files, setFiles] = useState<File[] | undefined>(undefined);
  const [rows, setRows] = useState<Row[] | null>(null);

  const columns = useMemo(() => {
    if (!rows?.length) return [];
    const first = rows[0] as Record<string, unknown>;
    return Object.keys(first);
  }, [rows]);

  async function handleDrop(acceptedFiles: File[]) {
    setRows(null);
    setFiles(acceptedFiles);

    const file = acceptedFiles[0];
    if (!file) return;

    let text = "";
    try {
      text = await file.text();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to read file");
    }
    const { error, data } = safeParseCSV(text, schema, { dedupeBy });

    if (error) {
      toast.error(error.message);
      console.error(error);
      return;
    }
    setRows(data);
  }

  function isOptionalish(field: z.ZodTypeAny): boolean {
    return (
      field.isOptional?.() === true ||
      field.isNullable?.() === true ||
      field instanceof z.ZodDefault
    );
  }

  function handleSubmit() {
    if (!rows) return;
    onSubmit(rows);
  }

  function handleClear() {
    setRows(null);
    setFiles(undefined);
  }

  function handleDownloadTemplate() {
    downloadTemplateCSV(Object.keys(schema.shape), exampleRow);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV</CardTitle>
        <CardDescription>
          Use these exact headers in the first row of your CSV.
        </CardDescription>
        <CardAction>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <DownloadIcon /> Download template/example CSV
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row gap-2">
          <div className="flex w-1/2 flex-col gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Required: </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(schema.shape)
                  .filter(([, field]) => !isOptionalish(field))
                  .map(([key, field]) => (
                    <Badge key={key} variant="outline">
                      <span className="font-medium">{key}</span>
                      <span
                        className="text-muted-foreground max-w-[100px] truncate"
                        title={zodTypeHumanReadableLabel(field)}
                      >
                        {zodTypeHumanReadableLabel(field)}
                      </span>
                    </Badge>
                  ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Optional: </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(schema.shape)
                  .filter(([, field]) => isOptionalish(field))
                  .map(([key, field]) => (
                    <Badge key={key} variant="outline">
                      <span className="font-medium">{key}</span>
                      <span className="text-muted-foreground text-wrap">
                        {zodTypeHumanReadableLabel(field)}
                      </span>
                    </Badge>
                  ))}
              </div>
            </div>
          </div>

          <Dropzone
            className="w-1/2"
            src={files}
            accept={{ "text/csv": [".csv"] }}
            maxFiles={1}
            onDrop={handleDrop}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </div>

        {rows && <Separator className="mt-2" />}
        <div className="no-scrollbar -mx-4 flex max-h-[25vh] flex-col items-center overflow-auto px-4 pt-2">
          {rows && (
            <div className="max-w-5xl">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    {columns.map((k) => (
                      <TableHead key={k} className="whitespace-nowrap">
                        {humanizeKey(k)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((row, i) => {
                    const r = row as Record<string, unknown>;
                    return (
                      <TableRow key={i}>
                        {columns.map((k) => (
                          <TableCell
                            key={k}
                            className="whitespace-nowrap"
                            title={valToSafeString(r[k])}
                          >
                            <div className="max-w-[25ch] truncate">
                              {valToSafeString(r[k])}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="w-full gap-2">
        <Button
          variant="destructive"
          onClick={handleClear}
          disabled={!files || !rows}
        >
          Clear
        </Button>
        <Button disabled={disabled || !rows} onClick={handleSubmit}>
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
