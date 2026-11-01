export type ReadErrorCode = "empty" | "columns" | "scanned" | "password" | "password_wrong" | "broken" | "unsupported";

export class ReadError extends Error {
  constructor(
    readonly code: ReadErrorCode,
    /** For "columns": the first rows, so the user can pick the columns by hand. */
    readonly rows?: string[][],
  ) {
    super(code);
  }
}
