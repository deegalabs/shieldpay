/**
 * Map a human payment reference to a YYYYMM integer month.
 *
 * This is the `month` value the employer signs into each income record (feature
 * F1). The range proof treats month as an opaque field element: it only has to be
 * consistent between signing and proving, which it always is here. Using a real
 * YYYYMM keeps records human-meaningful. English month tokens are supported
 * (e.g. "MAY2026" -> 202605), as is a plain YYYYMM / YYYY-MM form. Anything
 * unrecognized folds to a stable numeric so issuance still succeeds for free-form
 * references, without ever throwing.
 */
const MONTHS: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

export function monthFromReference(reference: string): number {
  const r = reference.trim().toUpperCase();

  // Plain numeric form: YYYYMM, YYYY-MM, YYYY.MM, YYYY/MM.
  const numeric = r.match(/^(\d{4})[-./]?(\d{2})$/);
  if (numeric) {
    const year = Number(numeric[1]!);
    const month = Number(numeric[2]!);
    if (month >= 1 && month <= 12) return year * 100 + month;
  }

  // Named month + year: MAY2026, MAY 2026, MAY-2026, MAY.2026.
  const named = r.match(/^([A-Z]{3,9})[\s\-./]*(\d{4})$/);
  if (named) {
    const month = MONTHS[named[1]!.slice(0, 3)];
    if (month) return Number(named[2]!) * 100 + month;
  }

  // Deterministic, stable fallback for free-form references.
  let h = 0;
  for (let i = 0; i < r.length; i++) h = (h * 31 + r.charCodeAt(i)) >>> 0;
  return 900000 + (h % 100000);
}
