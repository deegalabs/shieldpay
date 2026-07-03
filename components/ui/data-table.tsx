import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * The dense, finance-grade table. ShieldPay's primary reading surface: payment
 * history, receipts, contributors, the audit export. A real semantic `<table>`
 * that replaces the flex-div "lists" the app shipped with, so a currency column
 * can right-align and its decimals can stack down the column (the core
 * credibility move). See patterns/components/data-table.md and STYLE.md.
 *
 * Two ways to use it, pick per screen:
 *
 *   1. `<DataTable columns={...} rows={...} rowKey={...} />`, the config form.
 *      Typed columns with an `align` option ('money' right-aligns and renders
 *      the cell in `.amount` mono tabular). Best when a screen maps an array of
 *      typed rows (PaymentRow, PayrollRunRow, contributors, ...).
 *
 *   2. The composable primitives `Table / TableHead / TableBody / TableRow /
 *      TableHeaderCell / TableCell`, when a screen needs full control over cell
 *      markup (e.g. the auditor view's disclosed-amount border sweep).
 *
 * The overline column label (12px / 550 / +0.06em / uppercase, `fg-subtle`)
 * matches the `.overline` utility in globals.css and identity/typography.md.
 */

const OVERLINE = 'text-xs font-[550] uppercase tracking-[0.06em] text-fg-subtle';

/* ------------------------------------------------------------------ */
/* Composable primitives                                               */
/* ------------------------------------------------------------------ */

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement> & { caption?: React.ReactNode }
>(({ className, caption, children, ...props }, ref) => (
  <table ref={ref} className={cn('w-full border-collapse text-sm', className)} {...props}>
    {caption != null && <caption className="sr-only">{caption}</caption>}
    {children}
  </table>
));
Table.displayName = 'Table';

export function TableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  // surface-2 header fill with a hairline bottom, per the anatomy spec.
  return <thead className={cn('bg-surface-2 [&_tr]:border-b [&_tr]:border-border', className)} {...props} />;
}

export function TableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** 44px compact row for full-screen tables (audit export). Default 52px. */
  compact?: boolean;
  /** Selected reads as `surface-3` plus a 2px inset indigo left rule. */
  selected?: boolean;
  /** Whether the row shows a pointer + focus ring (set when clickable/linked). */
  interactive?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, compact, selected, interactive, ...props }, ref) => (
    <tr
      ref={ref}
      data-selected={selected ? 'true' : undefined}
      aria-selected={selected || undefined}
      className={cn(
        'row-dense',
        compact && 'is-compact',
        interactive &&
          'relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = 'TableRow';

export type CellAlign = 'left' | 'right' | 'money';

function alignClass(align: CellAlign | undefined): string {
  // 'money' relies on the global `td.amount` rule (mono, tabular, right-align).
  if (align === 'money') return 'amount';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

export interface TableHeaderCellProps
  extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  align?: CellAlign;
}

export const TableHeaderCell = React.forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ className, align, ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      className={cn(
        OVERLINE,
        'px-4 py-2 align-middle',
        align === 'money' || align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
      {...props}
    />
  ),
);
TableHeaderCell.displayName = 'TableHeaderCell';

export interface TableCellProps
  extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  align?: CellAlign;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('px-4 align-middle text-fg-strong', alignClass(align), className)}
      {...props}
    />
  ),
);
TableCell.displayName = 'TableCell';

/* ------------------------------------------------------------------ */
/* Config-driven DataTable                                             */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  /** Header label; rendered in the overline tier. */
  header: React.ReactNode;
  /** Renders the cell for a row. Do the formatting here (e.g. `usd(cents)`). */
  cell: (row: T, index: number) => React.ReactNode;
  /**
   * left (default), right, or money. 'money' right-aligns and renders the cell
   * in `.amount` (Geist Mono, tabular-nums) so decimals stack down the column.
   */
  align?: CellAlign;
  /** Stable column key; falls back to the column index. */
  key?: string;
  /** Extra classes on the body `<td>`. */
  className?: string;
  /** Extra classes on the header `<th>`. */
  headerClassName?: string;
}

export interface DataTableProps<T>
  extends Omit<React.HTMLAttributes<HTMLTableElement>, 'children'> {
  columns: Array<Column<T>>;
  rows: T[];
  /** Stable React key per row. */
  rowKey: (row: T, index: number) => React.Key;
  /**
   * Optional per-row link. When set, the whole row navigates via a stretched
   * anchor. Interactive content inside a cell (a button, a nested link) must
   * sit above it with `relative z-10`, otherwise the row link captures it.
   */
  rowHref?: (row: T) => string | undefined;
  /** Accessible label for the stretched row link. */
  rowLabel?: (row: T) => string;
  /** Optional per-row click handler (used when there is no `rowHref`). */
  onRowClick?: (row: T) => void;
  /** Marks a row selected: `surface-3` plus the 2px inset indigo left rule. */
  selected?: (row: T) => boolean;
  /** Screen-reader caption describing the table. */
  caption?: React.ReactNode;
  /** 44px compact rows for full-screen tables (audit export). Default 52px. */
  compact?: boolean;
  /**
   * Rendered in place of the body when there are no rows. Keep it calm: a single
   * 20px glyph and one line of `fg-subtle` copy.
   */
  empty?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  rowLabel,
  onRowClick,
  selected,
  caption,
  compact,
  empty,
  className,
  ...props
}: DataTableProps<T>) {
  return (
    <Table caption={caption} className={className} {...props}>
      <TableHead>
        <tr>
          {columns.map((col, ci) => (
            <TableHeaderCell key={col.key ?? ci} align={col.align} className={col.headerClassName}>
              {col.header}
            </TableHeaderCell>
          ))}
        </tr>
      </TableHead>
      <TableBody>
        {rows.length === 0 && empty != null ? (
          <tr>
            <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-fg-subtle">
              {empty}
            </td>
          </tr>
        ) : (
          rows.map((row, ri) => {
            const href = rowHref?.(row);
            const isSelected = selected?.(row) ?? false;
            const interactive = Boolean(href) || Boolean(onRowClick);
            return (
              <TableRow
                key={rowKey(row, ri)}
                compact={compact}
                selected={isSelected}
                interactive={interactive}
                tabIndex={onRowClick && !href ? 0 : undefined}
                role={onRowClick && !href ? 'button' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick && !href
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((col, ci) => (
                  <TableCell key={col.key ?? ci} align={col.align} className={col.className}>
                    {ci === 0 && href && (
                      // Stretched link: covers the whole (relatively positioned) row.
                      <a
                        href={href}
                        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
                        aria-label={rowLabel?.(row)}
                      >
                        <span className="sr-only">{rowLabel?.(row) ?? 'Open row'}</span>
                      </a>
                    )}
                    {col.cell(row, ri)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
