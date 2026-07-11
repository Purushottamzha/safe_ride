import {
  Box, TextField, Select, MenuItem, InputAdornment, Chip, Button, alpha, useTheme,
} from '@mui/material';
import { Search, Clear, FilterList } from '@mui/icons-material';
import { useState } from 'react';

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
}

interface FilterToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  onFilterChange?: (key: string, value: string) => void;
  onClear?: () => void;
}

export default function FilterToolbar({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters,
  onFilterChange,
  onClear,
}: FilterToolbarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hasFilters = searchValue || filters?.some(f => f.value);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            minWidth: 280,
            flex: { xs: 1, sm: 'unset' },
            '& .MuiOutlinedInput-root': {
              bgcolor: isDark ? alpha(theme.palette.background.paper, 0.5) : alpha(theme.palette.common.white, 0.8),
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchValue ? (
              <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={() => onSearchChange('')}>
                <Clear fontSize="small" />
              </InputAdornment>
            ) : null,
          }}
        />
        {filters && filters.length > 0 && (
          <>
            <Button
              size="small"
              variant={showFilters ? 'contained' : 'outlined'}
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Filters
            </Button>
            {showFilters && filters.map((filter) => (
              <Select
                key={filter.key}
                size="small"
                value={filter.value}
                onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                displayEmpty
                sx={{
                  minWidth: 130,
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              >
                <MenuItem value="">{filter.label}</MenuItem>
                {filter.options.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            ))}
          </>
        )}
        {hasFilters && (
          <Chip
            label="Clear"
            size="small"
            onDelete={onClear}
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>
    </Box>
  );
}
