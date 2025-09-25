import * as XLSX from "xlsx";

export async function excelFileToWorkbook(file: File) {
  const arrayBuffer = await file.arrayBuffer();

  return XLSX.read(arrayBuffer, {
    type: "array",
    dense: true, // faster: rows are arrays instead of objects
    cellDates: true,
    cellNF: false, // don’t parse number formats
    cellStyles: false, // skip style parsing
    cellHTML: false, // skip HTML generation
    sheetStubs: false, // don’t create empty stub cells
  });
}

// Narrowing helpers
function isCellObject(x: unknown): x is XLSX.CellObject {
  return !!x && typeof x === "object" && "t" in (x as XLSX.CellObject);
}

type DenseRow = Array<XLSX.CellObject | undefined>;
function isDenseWorksheet(ws: XLSX.WorkSheet): ws is DenseRow[] {
  return Array.isArray(ws);
}

export function usedRange(ws: XLSX.WorkSheet): XLSX.Range {
  const dense = isDenseWorksheet(ws);

  let minR = Number.POSITIVE_INFINITY;
  let minC = Number.POSITIVE_INFINITY;
  let maxR = -1;
  let maxC = -1;

  if (dense) {
    // Dense mode: ws is an array of rows, each row an array of cells
    const rows = ws;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (isCellObject(cell) && cell.t !== "z" && cell.v !== undefined) {
          if (r < minR) minR = r;
          if (c < minC) minC = c;
          if (r > maxR) maxR = r;
          if (c > maxC) maxC = c;
        }
      }
    }
  } else {
    // Sparse mode: keys like "A1", "B2"
    for (const addr of Object.keys(ws)) {
      if (addr.startsWith("!")) continue; // meta keys
      const cellUnknown = (ws as Record<string, unknown>)[addr];
      if (
        !isCellObject(cellUnknown) ||
        cellUnknown.v === undefined ||
        cellUnknown.t === "z"
      )
        continue;

      const { r, c } = XLSX.utils.decode_cell(addr);
      if (r < minR) minR = r;
      if (c < minC) minC = c;
      if (r > maxR) maxR = r;
      if (c > maxC) maxC = c;
    }
  }

  // Fallback to declared !ref or A1:A1 if no cells were detected
  if (maxR < 0 || maxC < 0) {
    const ref = typeof ws["!ref"] === "string" ? ws["!ref"] : "A1:A1";
    return XLSX.utils.decode_range(ref);
  }

  // If only one row (likely headers), extend by one so sheet_to_json has room for data
  if (maxR === minR) {
    maxR = Math.min(maxR + 1, 1048575); // Excel max rows - 1
  }

  return { s: { r: minR, c: minC }, e: { r: maxR, c: maxC } };
}

export function sanitizeSheet(rows: Record<string, unknown>[]) {
  return rows.map((row) => {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      const cleanKey = key.replace(/[\r\n\t*]+/g, " ").trim();

      let cleanValue = value;
      if (typeof value === "string") {
        cleanValue = value.trim();
      }

      sanitized[cleanKey] = cleanValue;
    }

    return sanitized;
  });
}

// takes in Uint8Array and converts to spreadsheet, downloads as [filename].xlsx
export function downloadSheet(data: Uint8Array, filename: string) {
  const array = new Uint8Array(data); // ensure data is Uint8Array - error shows on blob instantiation without this line, works either way though
  const blob = new Blob([array], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
