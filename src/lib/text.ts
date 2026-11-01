const TURKISH: Record<string, string> = {
  ı: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ö: "o",
  Ö: "o",
  ç: "c",
  Ç: "c",
};

/**
 * Lower-case ASCII form used for matching: "İşlem Tarihi", "ISLEM TARIHI" and "islem tarihi" all become
 * "islem tarihi". Turkish letters are mapped by hand because "İ".toLowerCase() is "i" plus a combining dot.
 */
export function fold(text: string): string {
  return text
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (c) => TURKISH[c])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Bank exports come as UTF-8, UTF-16 (Excel "Unicode text") or the old Windows code page.
 * Windows-1254 is the Turkish one and matches Windows-1252 everywhere except six letters.
 */
export function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return new TextDecoder("utf-8").decode(bytes.subarray(3));
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1254").decode(bytes);
  }
}
