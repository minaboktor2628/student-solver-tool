import { toDelimitedText } from "./csv";

type DownloadData =
  | { kind: "text"; text: string; mime?: string; encoding?: string }
  | { kind: "csv"; text: string; mime: "text/csv;charset=utf-8" }
  | { kind: "bytes"; bytes: BlobPart; mime: string };

export type DownloadFileOptions = {
  filename: string;
  data: DownloadData;
};

export function downloadFile({ filename, data }: DownloadFileOptions) {
  let blob: Blob;

  switch (data.kind) {
    case "text": {
      blob = new Blob([data.text], {
        type: data.mime ?? `text/plain;charset=${data.encoding ?? "utf-8"}`,
      });
      break;
    }
    case "bytes": {
      blob = new Blob([data.bytes], { type: data.mime });
      break;
    }
    case "csv": {
      blob = new Blob([data.text], { type: data.mime });
      break;
    }
  }

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";

  // Safari sometimes needs the link in DOM
  document.body.appendChild(a);
  a.click();
  a.remove();

  // small delay helps Safari in some cases
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function downloadTemplateCSV<T extends Record<string, unknown>>(
  headers: (keyof T & string)[] | string[],
  rows?: T | T[],
  filename = "template.csv",
) {
  const normalizedRows: T[] =
    rows == null ? [] : Array.isArray(rows) ? rows : [rows];

  // If toDelimitedText expects string[] for headers, this cast is fine
  const headerStrings = headers as string[];

  const csv = toDelimitedText(headerStrings, normalizedRows, {
    delimiter: ",",
    includeBOM: true,
  });

  downloadFile({
    filename,
    data: { kind: "text", text: csv, mime: "text/csv" },
  });
}

export function downloadTemplateTSV(
  headers: string[],
  example?: Record<string, unknown>,
  filename = "template.tsv",
) {
  const tsv = toDelimitedText(headers, example ? [example] : [], {
    delimiter: "\t",
    includeBOM: true,
  });

  downloadFile({
    filename,
    data: { kind: "text", text: tsv, mime: "text/tab-separated-values" },
  });
}

export function downloadTemplateJSON(
  example: unknown,
  filename = "template.json",
) {
  const json = JSON.stringify(example, null, 2);
  downloadFile({
    filename,
    data: { kind: "text", text: json, mime: "application/json" },
  });
}
