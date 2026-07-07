import { useOutletContext, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Fab from '@mui/material/Fab';
import { useQuery } from '@tanstack/react-query';
import { getMyChildren } from '@/services/students';
import { getTodayStatus } from '@/services/attendance';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';
import type { Student } from '@/types';

interface OutletContext {
  students: Student[];
  selectedStudentId: string;
}

function StudentListItem({ student }: { student: Student }) {
  const navigate = useNavigate();
  const { data: todayStatus } = useQuery({
    queryKey: ['today-status', student.id],
    queryFn: () => getTodayStatus(student.id),
    refetchInterval: 30000,
  });

  const statusColor = todayStatus?.status === 'present' ? '#10B981'
    : todayStatus?.status === 'absent' ? '#EF4444'
    : todayStatus?.status === 'late' ? '#F59E0B'
    : todayStatus?.currentTripStatus === 'BOARDED' || todayStatus?.currentTripStatus === 'IN_TRANSIT'
    ? '#3B82F6' : '#94A3B8';

  return (
    <Card
      sx={{
        mb: 1.5,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
        borderLeft: `4px solid ${statusColor}`,
      }}
      onClick={() => navigate(`/student/${student.id}`)}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar
          src={student.photoUrl}
          sx={{
            width: 52,
            height: 52,
            bgcolor: 'primary.light',
            fontSize: '1.25rem',
            fontWeight: 700,
          }}
        >
          {student.name.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontSize: '1rem', fontWeight: 700 }}>
            {student.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {student.grade} &bull; {student.school}
          </Typography>
          {todayStatus && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColor }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: statusColor }}>
                {todayStatus.message}
              </Typography>
            </Box>
          )}
        </Box>
        <ArrowForwardIcon color="action" fontSize="small" />
      </CardContent>
    </Card>
  );
}

export default function StudentsList() {
  const { students } = useOutletContext<OutletContext>();

  const { data: studentsList = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: getMyChildren,
    initialData: students,
  });

  if (isLoading) {
    return <LoadingScreen message="Loading students..." />;
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <PeopleIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          My Children
        </Typography>
      </Box>

      {studentsList.length === 0 ? (
        <EmptyState
          title="No students linked"
          description="You don't have any children linked to your account yet."
          icon={<PeopleIcon sx={{ fontSize: 56, color: 'text.disabled' }} />}
        />
      ) : (
        studentsList.map((student) => (
          <StudentListItem key={student.id} student={student} />
        ))
      )}

      <Fab
        variant="extended"
        color="primary"
        sx={{ position: 'fixed', bottom: { xs: 80, sm: 32 }, right: 32 }}
        onClick={() => navigate('/register-student')}
      >
        <PersonAddIcon sx={{ mr: 1 }} />
        Register New Student
      </Fab>
    </Box>
  );
}
