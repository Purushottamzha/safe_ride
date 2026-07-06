import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  Box,
  Typography,
  Skeleton,
  Paper,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InboxIcon from '@mui/icons-material/Inbox';
import { AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';

export interface Column<T> {
  id: string;
  label: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  limit: number;
  loading?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRowClick?: (row: T) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  hideSearch?: boolean;
  rowKey?: (row: T) => string;
}

function DataTable<T extends object>({
  columns,
  data,
  total,
  page,
  limit,
  loading = false,
  search = '',
  onSearchChange,
  onPageChange,
  onLimitChange,
  onRowClick,
  onSort,
  sortColumn,
  sortDirection = 'asc',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data found',
  emptyDescription = 'Try adjusting your search or filters.',
  hideSearch = false,
  rowKey,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState(search);

  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearch(value);
      const timer = setTimeout(() => {
        onSearchChange?.(value);
      }, 400);
      return () => clearTimeout(timer);
    },
    [onSearchChange]
  );

  return (
    <Paper
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {!hideSearch && (
        <Box sx={{ p: 2, pb: 0 }}>
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 360 }}
          />
        </Box>
      )}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  width={col.width}
                  align={col.align}
                  sortDirection={sortColumn === col.id ? sortDirection : false}
                >
                  {col.sortable && onSort ? (
                    <TableSortLabel
                      active={sortColumn === col.id}
                      direction={sortColumn === col.id ? sortDirection : 'asc'}
                      onClick={() => {
                        const dir = sortColumn === col.id && sortDirection === 'asc' ? 'desc' : 'asc';
                        onSort(col.id, dir);
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton variant="text" width="80%" height={24} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <InboxIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Typography variant="h6" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      {emptyDescription}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {data.map((row, index) => (
                  <TableRow
                    key={rowKey?.(row) ?? String((row as any).id ?? index)}
                    hover={!!onRowClick}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.id} align={col.align}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={limit}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Paper>
  );
}

export default DataTable;
