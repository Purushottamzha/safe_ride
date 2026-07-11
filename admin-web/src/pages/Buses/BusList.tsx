import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Button,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import {
  DirectionsBus,
  Edit,
  Delete,
  Visibility,
  Add,
  MyLocation,
  People,
  AccessTime,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { busService } from '../../services/buses';

function formatGpsUpdate(update?: string): string {
  if (!update) return 'N/A';
  const diff = Date.now() - new Date(update).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function BusList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(12);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['buses', page, limit, search, statusFilter],
    queryFn: () => busService.list({
      page: page + 1,
      limit,
      search: search || undefined,
      status: (statusFilter as any) || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => busService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      setDeleteId(null);
    },
  });

  const buses = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Buses"
        subtitle={`${total} total buses`}
        actions={[{ label: 'Add Bus', to: '/buses/new', variant: 'contained', icon: <Add /> }]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search by plate or bus number..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 260 }}
        />
        <TextField select size="small" label="Status" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </TextField>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Box component="span"><Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button></Box>
        }>
          {(error as any)?.message ?? 'Failed to load buses'}
        </Alert>
      )}

      {isLoading ? (
        <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : buses.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <DirectionsBus sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No buses found</Typography>
          <Typography variant="body2" color="text.disabled">
            Try adjusting your search or filters, or add a new bus.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
          <AnimatePresence>
            {buses.map((bus) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={bus.id}>
                <motion.div variants={cardVariants} layout whileHover={{ y: -4 }} style={{ height: '100%' }}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      borderRadius: 3,
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: '0px 8px 24px rgba(0,0,0,0.1)' },
                      position: 'relative',
                      overflow: 'visible',
                    }}
                    onClick={() => navigate(`/buses/${bus.id}`)}
                  >
                    <Box
                      sx={{
                        height: 8,
                        bgcolor: bus.status === 'ACTIVE' ? 'success.main'
                          : bus.status === 'MAINTENANCE' ? 'warning.main'
                          : 'grey.300',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                      }}
                    />
                    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DirectionsBus sx={{ color: 'primary.main', fontSize: 28 }} />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                              {bus.plateNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              #{bus.busNumber}
                            </Typography>
                          </Box>
                        </Box>
                        <StatusBadge status={bus.status.toLowerCase()} />
                      </Box>

                      {bus.model && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {bus.model}{bus.year ? ` (${bus.year})` : ''}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
                        <People fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Capacity: <strong>{bus.capacity}</strong> seats
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Occupancy</Typography>
                          <Typography variant="caption" fontWeight={600}>
                            - / {bus.capacity}
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={0}
                          sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200' }} />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                        <MyLocation fontSize="small" color="action" sx={{ fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {bus.lastGpsLat && bus.lastGpsLng
                            ? `${bus.lastGpsLat.toFixed(4)}, ${bus.lastGpsLng.toFixed(4)}`
                            : 'No GPS data'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <AccessTime fontSize="small" color="action" sx={{ fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">
                          Last update: {formatGpsUpdate(bus.lastGpsUpdate)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25, mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/buses/${bus.id}`); }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/buses/${bus.id}/edit`); }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(bus.id); }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      {!isLoading && buses.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, alignItems: 'center' }}>
          <IconButton disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <Typography>Prev</Typography>
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            Page {page + 1} of {data?.meta?.totalPages ?? 1}
          </Typography>
          <IconButton disabled={page + 1 >= (data?.meta?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>
            <Typography>Next</Typography>
          </IconButton>
          <TextField
            select size="small" value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }}
            sx={{ minWidth: 80, ml: 2 }}
          >
            {[12, 24, 48].map(n => (
              <MenuItem key={n} value={n}>{n} per page</MenuItem>
            ))}
          </TextField>
        </Box>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Bus"
        message="Are you sure you want to delete this bus? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </motion.div>
  );
}
