export interface EditorFile {
  filename: string;
  code: string;
  language?: string; // "json" | "ts" | etc
}
