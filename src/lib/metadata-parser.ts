/**
 * Utility to parse metadata (series, issue number, publication year) from a comic filename.
 */
export interface ParsedComicMetadata {
  series: string;
  issue: number | null;
  year: number | null;
}

export function parseComicFilename(filename: string): ParsedComicMetadata {
  // Strip file extension
  const cleanName = filename.replace(/\.(cbz|cbr|zip|rar)$/i, '').trim();

  let series = cleanName;
  let issue: number | null = null;
  let year: number | null = null;

  // 1. Extract year: look for 4-digit numbers in parentheses, e.g. "(1974)" or "(2020)"
  const yearMatch = cleanName.match(/\((\d{4})\)/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
    series = series.replace(/\(\d{4}\)/, '').trim();
  } else {
    // Try matching naked 4 digit year at the end or boundaries, e.g. " 1989" or " 2020"
    const endYearMatch = cleanName.match(/\b(19\d{2}|20\d{2})\b/);
    if (endYearMatch) {
      year = parseInt(endYearMatch[1], 10);
      series = series.replace(/\b(19\d{2}|20\d{2})\b/, '').trim();
    }
  }

  // 2. Extract issue number: look for # followed by digits (e.g. "#129")
  const hashIssueMatch = series.match(/#(\d+)/);
  if (hashIssueMatch) {
    issue = parseInt(hashIssueMatch[1], 10);
    series = series.replace(/#\d+/, '').trim();
  } else {
    // Look for digits following a dash or double space (e.g. "- 023")
    const dashIssueMatch = series.match(/-\s*(\d+)/);
    if (dashIssueMatch) {
      issue = parseInt(dashIssueMatch[1], 10);
      series = series.replace(/-\s*\d+/, '').trim();
    } else {
      // Look for a standalone number at the end of the series name (e.g. "Batman 004")
      const numberAtEndMatch = series.match(/\b(\d+)\b$/);
      if (numberAtEndMatch) {
        issue = parseInt(numberAtEndMatch[1], 10);
        series = series.replace(/\b\d+$/, '').trim();
      }
    }
  }

  // Clean up any remaining trailing dashes/hashes or double spaces
  series = series
    .replace(/[-#]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    series: series || cleanName,
    issue,
    year,
  };
}
