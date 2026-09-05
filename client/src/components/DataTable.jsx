import React from 'react';
import EmptyState from './EmptyState';

export default function DataTable({
  columns,
  data = [],
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  emptyAction,
  onRowClick,
  rowKey = '_id'
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`table-th ${col.className || ''} ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && (
              <>
                {[1, 2, 3, 4, 5].map((skeletonRow) => (
                  <tr key={skeletonRow} className="animate-pulse">
                    {columns.map((_, colIdx) => (
                      <td key={colIdx} className="table-td py-3.5">
                        <div className="h-4 bg-slate-100 rounded w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            )}

            {!loading &&
              data.map((item, rowIdx) => {
                const isClickable = Boolean(onRowClick);
                const keyVal = item[rowKey] || rowIdx;
                return (
                  <tr
                    key={keyVal}
                    onClick={() => isClickable && onRowClick(item)}
                    className={`transition-colors duration-150 ${
                      isClickable
                        ? 'cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/60'
                        : 'hover:bg-slate-50/40'
                    }`}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={col.key || colIdx}
                        className={`table-td ${col.className || ''} ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(item, rowIdx) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
