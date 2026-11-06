/**
 * Sanitizes a cell value to prevent CSV Formula Injection (CWE-1236 / OWASP).
 * Prepends a single quote if the value begins with =, +, -, @, tab, or carriage return.
 * Also escapes inner double-quotes and wraps in quotes.
 */
export function sanitizeCsvValue(value) {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // If starts with dangerous formula prefixes, neutralize with leading single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape inner quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Builds a valid RFC 4180 CSV string from headers and rows
 */
export function buildCsv(headers, rows) {
  const headerLine = headers.map(sanitizeCsvValue).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvValue).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

