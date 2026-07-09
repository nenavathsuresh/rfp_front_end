import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Badge,
  Button,
  Caption1,
  Divider,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Toolbar,
  ToolbarButton,
  Tooltip,
  type InputOnChangeData,
} from '@fluentui/react-components'

export type WorkflowResult = {
  id: string
  section: string
  requirement: string
  status: string
  owner: string
  confidence: string
  summary: string
}

type WorkflowResultsTableProps = {
  data: WorkflowResult[]
  isLoading: boolean
  onRun: () => void
}

const columns: Array<ColumnDef<WorkflowResult>> = [
  { accessorKey: 'section', header: 'Section' },
  { accessorKey: 'requirement', header: 'Requirement' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = String(getValue())
      const appearance = status.toLowerCase().includes('complete') ? 'filled' : 'tint'
      return <Badge appearance={appearance}>{status}</Badge>
    },
  },
  { accessorKey: 'owner', header: 'Owner' },
  { accessorKey: 'confidence', header: 'Confidence' },
  { accessorKey: 'summary', header: 'Summary' },
]

export function WorkflowResultsTable({ data, isLoading, onRun }: WorkflowResultsTableProps) {
  const [globalFilter, setGlobalFilter] = useState('')
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const visibleRows = table.getRowModel().rows
  const resultLabel = useMemo(
    () => `${visibleRows.length} result${visibleRows.length === 1 ? '' : 's'}`,
    [visibleRows.length],
  )

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text as="h2" weight="semibold" size={500}>Workflow Results</Text>
          <Caption1 className="block text-slate-500">{resultLabel}</Caption1>
        </div>
        <Toolbar className="flex flex-wrap gap-2">
          <Input
            aria-label="Search workflow results"
            placeholder="Search results"
            value={globalFilter}
            onChange={(_: ChangeEvent<HTMLInputElement>, eventData: InputOnChangeData) => setGlobalFilter(eventData.value)}
          />
          <Tooltip content="Run backend workflow" relationship="label">
            <ToolbarButton appearance="primary" disabled={isLoading} onClick={onRun}>
              {isLoading ? <Spinner size="tiny" /> : 'Start Workflow'}
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </div>

      <div className="overflow-x-auto">
        <Table aria-label="Workflow results table" sortable>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeaderCell
                    key={header.id}
                    className="min-w-36 cursor-pointer whitespace-nowrap bg-slate-50 text-xs font-bold uppercase text-slate-600"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHeaderCell>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="flex items-center gap-3 px-2 py-8 text-slate-600">
                    <Spinner size="small" />
                    <span>Running workflow...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && visibleRows.length ? visibleRows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="max-w-80 align-top text-sm text-slate-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            )) : null}
            {!isLoading && !visibleRows.length ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="px-2 py-8 text-sm text-slate-500">Run the workflow to populate the results table.</div>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      <Divider />
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Caption1 className="text-slate-500">Sorted columns can be toggled from the header.</Caption1>
        <Button appearance="secondary" disabled={isLoading} onClick={onRun}>Refresh</Button>
      </div>
    </section>
  )
}

