import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { enrollmentService } from '../../services/enrollmentService';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { Check, X, KeyRound, AlertCircle, UserPlus, Users, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';


export function Approvals() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'passwords' | 'enrollments'>('enrollments');
  
  const [passwordRequests, setPasswordRequests] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state for password reset
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch password reset requests
      const { data: resetsData, error: resetsError } = await supabase
        .from('password_reset_requests')
        .select(`
          *,
          profiles:student_id (
            full_name,
            username,
            roll_number
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (resetsError) throw resetsError;
      setPasswordRequests(resetsData || []);

      // Fetch pending students
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;
      setPendingStudents(studentsData || []);
      
      // Fetch pending enrollments
      const enrollmentsData = await enrollmentService.getPendingEnrollments();
      setPendingEnrollments(enrollmentsData || []);
      
    } catch (error) {
      console.error("Error fetching approvals data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprovePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/approve-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve request');
      }

      setPasswordRequests(passwordRequests.filter(r => r.id !== selectedRequest.id));
      closeModal();
    } catch (err: any) {
      setError(err.message || 'An error occurred while approving the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectPassword = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    
    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      
      setPasswordRequests(passwordRequests.filter(r => r.id !== requestId));
    } catch (error) {
      console.error("Error rejecting request:", error);
      Swal.fire("Failed to reject request.");
    }
  };

  const handleApproveStudent = async (studentId: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/approve-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ studentId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to approve student');

      setPendingStudents(pendingStudents.filter(s => s.id !== studentId));
    } catch (error: any) {
      console.error("Error approving student:", error);
      Swal.fire(error.message || "Failed to approve student.");
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    if (!window.confirm("Are you sure you want to reject and delete this registration request?")) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/reject-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ studentId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reject student');

      setPendingStudents(pendingStudents.filter(s => s.id !== studentId));
    } catch (error: any) {
      console.error("Error rejecting student:", error);
      Swal.fire(error.message || "Failed to reject student.");
    }
  };

  const handleApproveEnrollment = async (enrollmentId: string) => {
    try {
      await enrollmentService.approveEnrollment(enrollmentId);
      setPendingEnrollments(pendingEnrollments.filter(e => e.id !== enrollmentId));
    } catch (error: any) {
      console.error("Error approving enrollment:", error);
      Swal.fire(error.message || "Failed to approve enrollment.");
    }
  };

  const handleRejectEnrollment = async (enrollmentId: string) => {
    if (!window.confirm("Are you sure you want to reject this course enrollment?")) return;
    try {
      await enrollmentService.rejectEnrollment(enrollmentId);
      setPendingEnrollments(pendingEnrollments.filter(e => e.id !== enrollmentId));
    } catch (error: any) {
      console.error("Error rejecting enrollment:", error);
      Swal.fire(error.message || "Failed to reject enrollment.");
    }
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground mt-1">Manage pending approvals.</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-glass-highlight pb-px overflow-x-auto">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'enrollments' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-glass-highlight'
          }`}
          onClick={() => setActiveTab('enrollments')}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Course Enrollments
            {pendingEnrollments.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                {pendingEnrollments.length}
              </span>
            )}
          </div>
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'students' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-glass-highlight'
          }`}
          onClick={() => setActiveTab('students')}
        >
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            New Students
            {pendingStudents.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                {pendingStudents.length}
              </span>
            )}
          </div>
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'passwords' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-glass-highlight'
          }`}
          onClick={() => setActiveTab('passwords')}
        >
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Password Resets
            {passwordRequests.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                {passwordRequests.length}
              </span>
            )}
          </div>
        </button>
      </div>

      <GlassCard className="flex-1 p-6 relative overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
        ) : activeTab === 'enrollments' ? (
          pendingEnrollments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Check className="h-12 w-12 mb-4 opacity-20" />
              <p>No pending course enrollments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingEnrollments.map((enrollment) => (
                <GlassCard key={enrollment.id} className="p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{enrollment.profiles?.full_name}</h3>
                      <p className="text-sm text-muted-foreground">Roll: {enrollment.profiles?.roll_number}</p>
                      <div className="mt-2 p-2 bg-glass/30 rounded-lg border border-glass-highlight">
                        <p className="text-sm font-medium">Course: {enrollment.courses?.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Requested: {new Date(enrollment.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2 pt-4">
                    <GlassButton 
                      variant="primary" 
                      className="flex-1"
                      onClick={() => handleApproveEnrollment(enrollment.id)}
                    >
                      Approve
                    </GlassButton>
                    <GlassButton 
                      variant="danger" 
                      className="flex-none px-3"
                      onClick={() => handleRejectEnrollment(enrollment.id)}
                    >
                      <X className="h-4 w-4" />
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        ) : activeTab === 'students' ? (
          pendingStudents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Check className="h-12 w-12 mb-4 opacity-20" />
              <p>No pending student registrations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingStudents.map((student) => (
                <GlassCard key={student.id} className="p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{student.full_name}</h3>
                      <p className="text-sm text-muted-foreground">Roll: {student.roll_number}</p>
                      <p className="text-sm text-muted-foreground">Username: {student.username}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Registered: {new Date(student.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2 pt-4">
                    <GlassButton 
                      variant="primary" 
                      className="flex-1"
                      onClick={() => handleApproveStudent(student.id)}
                    >
                      Approve
                    </GlassButton>
                    <GlassButton 
                      variant="danger" 
                      className="flex-none px-3"
                      onClick={() => handleRejectStudent(student.id)}
                    >
                      <X className="h-4 w-4" />
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        ) : (
          passwordRequests.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Check className="h-12 w-12 mb-4 opacity-20" />
              <p>No pending password reset requests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {passwordRequests.map((request) => (
                <GlassCard key={request.id} className="p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{request.profiles?.full_name}</h3>
                      <p className="text-sm text-muted-foreground">Roll: {request.profiles?.roll_number}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <KeyRound className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2 pt-4">
                    <GlassButton 
                      variant="primary" 
                      className="flex-1"
                      onClick={() => setSelectedRequest(request)}
                    >
                      Approve
                    </GlassButton>
                    <GlassButton 
                      variant="danger" 
                      className="flex-none px-3"
                      onClick={() => handleRejectPassword(request.id)}
                    >
                      <X className="h-4 w-4" />
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        )}
      </GlassCard>

      {/* Approval Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold mb-2">Reset Password</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Set a new password for {selectedRequest.profiles?.full_name} ({selectedRequest.profiles?.roll_number}).
                </p>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2 text-error text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleApprovePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 ml-1">New Password</label>
                    <GlassInput 
                      type="password" 
                      placeholder="••••••••" 
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 ml-1">Confirm New Password</label>
                    <GlassInput 
                      type="password" 
                      placeholder="••••••••" 
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <GlassButton 
                      type="button" 
                      variant="ghost" 
                      className="flex-1" 
                      onClick={closeModal}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton 
                      type="submit" 
                      variant="primary" 
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Set Password'}
                    </GlassButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
