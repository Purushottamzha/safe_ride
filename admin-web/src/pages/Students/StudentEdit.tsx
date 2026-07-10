import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, TextField, MenuItem, Alert, CircularProgress,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { studentService } from '../../services/students';

const studentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  grade: z.string().min(1, 'Grade is required'),
  section: z.string().min(1, 'Section is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().optional(),
});

type StudentForm = z.infer<typeof studentSchema>;

export default function StudentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: StudentForm) => studentService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      navigate(`/students/${id}`);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    values: student ? {
      firstName: student.firstName,
      lastName: student.lastName,
      studentId: student.studentId,
      grade: student.grade,
      section: student.section ?? '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      address: student.address,
      phone: student.phone ?? '',
    } : undefined,
  });

  const onSubmit = (data: StudentForm) => updateMutation.mutate(data);

  if (loadingStudent) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/students" />
        <Card><CardContent sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></CardContent></Card>
      </Box>
    );
  }

  if (!student) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/students" />
        <Alert severity="warning">Student not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Edit Student" subtitle={`${student.firstName} ${student.lastName}`} showBack backTo={`/students/${id}`} />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {updateMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to update student</Alert>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First Name" error={!!errors.firstName} helperText={errors.firstName?.message} {...register('firstName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Last Name" error={!!errors.lastName} helperText={errors.lastName?.message} {...register('lastName')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Grade" select error={!!errors.grade} helperText={errors.grade?.message} {...register('grade')}>
                  {['1','2','3','4','5','6','7','8','9','10','11','12'].map((g) => (
                    <MenuItem key={g} value={g}>Grade {g}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Section" select error={!!errors.section} helperText={errors.section?.message} {...register('section')}>
                  {['A','B','C','D','E'].map((s) => (
                    <MenuItem key={s} value={s}>Section {s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Student ID" error={!!errors.studentId} helperText={errors.studentId?.message} {...register('studentId')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Date of Birth" type="date" InputLabelProps={{ shrink: true }}
                  error={!!errors.dateOfBirth} helperText={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone" error={!!errors.phone} helperText={errors.phone?.message} {...register('phone')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Address" error={!!errors.address} helperText={errors.address?.message} {...register('address')} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton variant="outlined" color="inherit" onClick={() => navigate(`/students/${id}`)}>Cancel</LoadingButton>
              <LoadingButton type="submit" variant="contained" loading={updateMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}>Save Changes</LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
