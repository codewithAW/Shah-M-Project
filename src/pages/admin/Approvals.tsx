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
import { API_BASE } from '../../config';


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
      const response = await fetch(`${API_BASE}/api/auth/approve-reset`, {
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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to reject this request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-primary)',
      cancelButtonColor: 'var(--color-danger)',
      confirmButtonText: 'Yes, reject it!',
      background: 'var(--color-glass-bg)',
      color: 'var(--color-foreground)'
    });
    if (!result.isConfirmed) return;
    
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
      const response = await fetch(`${API_BASE}/api/auth/approve-student`, {
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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to reject and delete this registration request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-primary)',
      cancelButtonColor: 'var(--color-danger)',
      confirmButtonText: 'Yes, reject it!',
      background: 'var(--color-glass-bg)',
      color: 'var(--color-foreground)'
    });
    if (!result.isConfirmed) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/reject-student`, {
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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to reject this course enrollment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-primary)',
      cancelButtonColor: 'var(--color-danger)',
      confirmButtonText: 'Yes, reject it!',
      background: 'var(--color-glass-bg)',
      color: 'var(--color-foreground)'
    });
    if (!result.isConfirmed) return;
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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Approvals</h1>
          <p className="text-muted font-medium mt-1">Manage pending approvals.</p>
        </div>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'enrollments' ? 'active' : ''}`}
          onClick={() => setActiveTab('enrollments')}
        >
          <BookOpen style={{ height: '1rem', width: '1rem' }} />
          Course
          {pendingEnrollments.length > 0 && (
            <span className="tab-badge">{pendingEnrollments.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <UserPlus style={{ height: '1rem', width: '1rem' }} />
          New
          {pendingStudents.length > 0 && (
            <span className="tab-badge">{pendingStudents.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'passwords' ? 'active' : ''}`}
          onClick={() => setActiveTab('passwords')}
        >
          <KeyRound style={{ height: '1rem', width: '1rem' }} />
          Reset
          {passwordRequests.length > 0 && (
            <span className="tab-badge">{passwordRequests.length}</span>
          )}
        </button>
      </div>

      <GlassCard className="d-flex flex-col p-6 shadow-sm" style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        {isLoading ? (
          <div className="d-flex items-center justify-center p-12"><div className="animate-spin h-8 w-8 rounded-full" style={{ border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div></div>
        ) : activeTab === 'enrollments' ? (
          pendingEnrollments.length === 0 ? (
            <div className="empty-state" style={{ height: '100%', border: 'none', background: 'transparent' }}>
              <div className="empty-state-icon">
                <Check style={{ height: '3rem', width: '3rem', opacity: 0.5 }} />
              </div>
              <p className="empty-state-desc">No pending course enrollments.</p>
            </div>
          ) : (
            <div className="dashboard-grid cols-3" style={{ overflowY: 'auto', paddingRight: '0.5rem' }}>
              {pendingEnrollments.map((enrollment) => (
                <GlassCard key={enrollment.id} className="d-flex flex-col p-6 transition-all hover-bg-white-10 shadow-sm group">
                  <div className="d-flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl">{enrollment.profiles?.full_name}</h3>
                      <p className="text-sm font-medium text-muted mt-1">Roll: {enrollment.profiles?.roll_number}</p>
                      <div className="mt-3 p-3 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-sm font-bold">Course: {enrollment.courses?.title}</p>
                      </div>
                      <p className="text-xs font-medium text-muted mt-3">
                        Requested: {new Date(enrollment.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="stat-icon text-primary" style={{ width: '3rem', height: '3rem', borderRadius: '1rem', flexShrink: 0 }}>
                      <BookOpen style={{ height: '1.25rem', width: '1.25rem' }} />
                    </div>
                  </div>

                  <div className="d-flex gap-3 pt-6 border-t border-white/5" style={{ marginTop: 'auto' }}>
                    <GlassButton 
                      variant="primary" 
                      style={{ flex: 1 }}
                      className="shadow-sm font-bold"
                      onClick={() => handleApproveEnrollment(enrollment.id)}
                    >
                      Approve
                    </GlassButton>
                    <GlassButton 
                      variant="danger" 
                      className="shadow-sm"
                      style={{ flexShrink: 0, padding: '0 1rem' }}
                      onClick={() => handleRejectEnrollment(enrollment.id)}
                    >
                      <X style={{ height: '1.25rem', width: '1.25rem' }} />
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        ) : activeTab === 'students' ? (
          pendingStudents.length === 0 ? (
            <div className="empty-state" style={{ height: '100%', border: 'none', background: 'transparent' }}>
              <div className="empty-state-icon">
                <Check style={{ height: '3rem', width: '3rem', opacity: 0.5 }} />
              </div>
              <p className="empty-state-desc">No pending student registrations.</p>
            </div>
          ) : (
            <div className="dashboard-grid cols-3" style={{ overflowY: 'auto', paddingRight: '0.5rem' }}>
              {pendingStudents.map((student) => (
                <GlassCard key={student.id} className="d-flex flex-col p-6 transition-all hover-bg-white-10 shadow-sm group">
                  <div className="d-flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl">{student.full_name}</h3>
                      <p className="text-sm font-medium text-muted mt-1">Roll: {student.roll_number}</p>
                      <p className="text-sm font-medium text-muted">Username: {student.username}</p>
                      <p className="text-xs font-medium text-muted mt-3">
                        Registered: {new Date(student.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="stat-icon text-primary" style={{ width: '3rem', height: '3rem', borderRadius: '1rem', flexShrink: 0 }}>
                      <Users style={{ height: '1.25rem', width: '1.25rem' }} />
                    </div>
                  </div>

                  <div className="d-flex gap-3 pt-6 border-t border-white/5" style={{ marginTop: 'auto' }}>
                    <GlassButton 
                      variant="primary" 
                      style={{ flex: 1 }}
                      className="shadow-sm font-bold"
                      onClick={() => handleApproveStudent(student.id)}
                    >
                      Approve
                    </GlassButton>
                    <GlassButton 
                      variant="danger" 
                      className="shadow-sm"
                      style={{ flexShrink: 0, padding: '0 1rem' }}
                      onClick={() => handleRejectStudent(student.id)}
                    >
                      <X style={{ height: '1.25rem', width: '1.25rem' }} />
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        ) : (
          passwordRequests.length === 0 ? (
            <div className="empty-state" style={{ height: '100%', border: 'none', background: 'transparent' }}>
              <div className="empty-state-icon">
                <Check style={{ height: '3rem', width: '3rem', opacity: 0.5 }} />
              </div>
              <p className="empty-state-desc">No pending password reset requests.</p>
            </div>
          ) : (
            <div className="dashboard-grid cols-3" style={{ overflowY: 'auto', paddingRight: '0.5rem' }}>
              {passwordRequests.map((request) => (
                <GlassCard key={request.id} className="d-flex flex-col p-6 transition-all hover-bg-white-10 shadow-sm group">
                  <div className="d-flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl">{request.profiles?.full_name}</h3>
                      <p className="text-sm font-medium text-muted mt-1">Roll: {request.profiles?.roll_number}</p>
                      <p className="text-xs font-medium text-muted mt-3">
                        Requested: {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="stat-icon text-primary" style={{ width: '3rem', height: '3rem', borderRadius: '1rem', flexShrink: 0 }}>
                      <KeyRound style={{ height: '1.25rem', width: '1.25rem' }} />
                    </div>
                  </div>

                  <div className="d-flex gap-3 pt-6 border-t border-white/5" style={{ marginTop: 'auto' }}>
                    <GlassButton 
                      variant="primary" 
                      style={{ flex: 1 }}
                      className="shadow-sm font-bold"
                      onClick={() => setSelectedRequest(request)}
                    >
                      Approve
                    </GlassButton>
                    <GlassButton 
                      variant="danger" 
                      className="shadow-sm"
                      style={{ flexShrink: 0, padding: '0 1rem' }}
                      onClick={() => handleRejectPassword(request.id)}
                    >
                      <X style={{ height: '1.25rem', width: '1.25rem' }} />
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        )}
      </GlassCard>

      {/* Approval Modal */}
      {/* Approval Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '100%', maxWidth: '28rem' }}
            >
              <GlassCard className="modal-content">
                <h2 className="modal-title">Reset Password</h2>
                <p className="text-sm font-medium text-muted mb-6">
                  Set a new password for {selectedRequest.profiles?.full_name} ({selectedRequest.profiles?.roll_number}).
                </p>

                {error && (
                  <div className="p-4 rounded-xl d-flex items-start gap-3 text-sm mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <AlertCircle style={{ height: '1.25rem', width: '1.25rem', flexShrink: 0 }} />
                    <span className="font-bold">{error}</span>
                  </div>
                )}

                <form onSubmit={handleApprovePassword} className="d-flex flex-col gap-5">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">New Password</label>
                    <GlassInput 
                      type="password" 
                      placeholder="••••••••" 
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Confirm New Password</label>
                    <GlassInput 
                      type="password" 
                      placeholder="••••••••" 
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
                    <GlassButton 
                      type="button" 
                      variant="ghost" 
                      style={{ flex: 1 }} 
                      onClick={closeModal}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton 
                      type="submit" 
                      variant="primary" 
                      className="shadow-sm"
                      style={{ flex: 1 }}
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
