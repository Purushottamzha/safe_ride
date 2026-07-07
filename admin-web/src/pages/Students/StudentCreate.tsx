import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { studentService } from '../../services/students';
import { schoolService } from '../../services/schools';
import { useAuthStore } from '../../store/authStore';

const studentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  grade: z.string().min(1, 'Grade is required'),
  section: z.string().min(1, 'Section is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(1, 'Address is required'),
  schoolId: z.string().min(1, 'School is required'),
});

type StudentForm = z.infer<typeof studentSchema>;

export default function StudentCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.list({ limit: 200 }),
    enabled: isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (data: StudentForm) => studentService.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate(`/students/${created.id}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      studentId: '',
      grade: '',
      section: '',
      dateOfBirth: '',
      address: '',
      schoolId: isSuperAdmin ? '' : (user?.schoolId ?? ''),
    },
  });

  const onSubmit = (data: StudentForm) => {
    createMutation.mutate(data);
  };

  return (
    <Box>
      <PageHeader
        title="Add Student"
        subtitle="Create a new student record"
        showBack
        backTo="/students"
      />

      <Card>
        <CardContent sx={{ p: 3 }}>
          {createMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to create student
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  {...register('firstName')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  {...register('lastName')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Grade"
                  select
                  error={!!errors.grade}
                  helperText={errors.grade?.message}
                  {...register('grade')}
                >
                  {['1','2','3','4','5','6','7','8','9','10','11','12'].map((g) => (
                    <MenuItem key={g} value={g}>Grade {g}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Section"
                  select
                  error={!!errors.section}
                  helperText={errors.section?.message}
                  {...register('section')}
                >
                  {['A','B','C','D','E'].map((s) => (
                    <MenuItem key={s} value={s}>Section {s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="School"
                  select
                  error={!!errors.schoolId}
                  helperText={errors.schoolId?.message}
                  {...register('schoolId')}
                  disabled={!isSuperAdmin}
                >
                  {isSuperAdmin ? (
                    (schoolsData?.data ?? []).map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))
                  ) : (
                    <MenuItem value={user?.schoolId ?? ''}>{user?.school?.name ?? 'Your School'}</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Student ID"
                  error={!!errors.studentId}
                  helperText={errors.studentId?.message}
                  {...register('studentId')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth?.message}
                  {...register('dateOfBirth')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address"
                  error={!!errors.address}
                  helperText={errors.address?.message}
                  {...register('address')}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/students')}
              >
                Cancel
              </LoadingButton>
              <LoadingButton
                type="submit"
                variant="contained"
                loading={createMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}
              >
                Create Student
              </LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
