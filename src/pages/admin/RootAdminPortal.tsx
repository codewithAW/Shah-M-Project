import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { UserPlus, Shield, User, LogOut, Search, KeyRound, Ban, Trash2, CheckCircle2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function RootAdminPortal() {
  const { session, signOut } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Teacher State
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manage Teacher State
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [manageAction, setManageAction] = useState<'edit' | 'reset' | 'suspend' | 'delete' | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/create-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          name,
          username,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create teacher');
      }

      await fetchTeachers();
      
      setIsCreating(false);
      setName('');
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the teacher.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let endpoint = '';
      let payload: any = { teacherId: selectedTeacher.id };

      if (manageAction === 'edit') {
        if (!editName || !editUsername) throw new Error("Name and Teacher ID are required.");
        endpoint = '/api/auth/update-teacher';
        payload.name = editName;
        payload.username = editUsername;
      } else if (manageAction === 'reset') {
        if (!newPassword || newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
        endpoint = '/api/auth/reset-teacher-password';
        payload.newPassword = newPassword;
      } else if (manageAction === 'suspend') {
        endpoint = '/api/auth/suspend-teacher';
        payload.suspend = selectedTeacher.status !== 'suspended';
      } else if (manageAction === 'delete') {
        endpoint = '/api/auth/delete-teacher';
      }

      const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${manageAction} teacher`);
      }

      await fetchTeachers();
      closeManageModal();
    } catch (err: any) {
      setError(err.message || `An error occurred during ${manageAction}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openManageModal = (teacher: any, action: 'edit' | 'reset' | 'suspend' | 'delete') => {
    setSelectedTeacher(teacher);
    setManageAction(action);
    setEditName(teacher.full_name);
    setEditUsername(teacher.username);
    setNewPassword('');
    setError(null);
  };

  const closeManageModal = () => {
    setSelectedTeacher(null);
    setManageAction(null);
    setNewPassword('');
    setEditName('');
    setEditUsername('');
    setError(null);
  };

  return (
    <div className="layout-container relative">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="bg-glow bg-glow-primary bg-glow-top-right"></div>
        <div className="bg-glow bg-glow-accent bg-glow-bottom-left"></div>
      </div>

      {/* Top Navbar */}
      <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="navbar-content">
          <div className="d-flex items-center gap-3">
            <div className="stat-icon text-primary" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '1rem' }}>
              <Shield style={{ height: '1.25rem', width: '1.25rem' }} />
            </div>
            <span className="navbar-brand">Admin</span>
          </div>
          <div className="d-flex items-center gap-4">
            <GlassButton variant="ghost" className="text-sm font-bold" onClick={signOut}>
              <LogOut style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
              Sign Out
            </GlassButton>
          </div>
        </div>
      </nav>

      <div className="dashboard-container relative" style={{ zIndex: 10 }}>
        <div className="dashboard-header" style={{ alignItems: 'center' }}>
          <div>
            <h1 className="dashboard-title">Teacher Management</h1>
            <p className="text-muted font-medium mt-1">Create, edit, suspend, and delete teacher accounts.</p>
          </div>
          <GlassButton 
            variant="primary" 
            className="shadow-sm font-bold"
            onClick={() => setIsCreating(true)}
          >
            <UserPlus style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
            Create Teacher
          </GlassButton>
        </div>

        {error && !isCreating && !manageAction && (
          <div className="p-4 rounded-xl text-sm font-bold mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <div className="dashboard-grid cols-3">
          <GlassCard className="d-flex items-center justify-between p-6 shadow-sm">
            <div>
              <p className="stat-label">Total Teachers</p>
              <p className="stat-value">{teachers.length}</p>
            </div>
            <div className="stat-icon text-primary">
              <User style={{ height: '1.75rem', width: '1.75rem' }} />
            </div>
          </GlassCard>
          <GlassCard className="d-flex items-center justify-between p-6 shadow-sm" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', background: 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' }}>
            <div>
              <p className="stat-label">Active</p>
              <p className="stat-value text-success">{teachers.filter(t => t.status !== 'suspended').length}</p>
            </div>
            <div className="stat-icon text-success" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle2 style={{ height: '1.75rem', width: '1.75rem' }} />
            </div>
          </GlassCard>
          <GlassCard className="d-flex items-center justify-between p-6 shadow-sm" style={{ border: '1px solid rgba(239, 68, 68, 0.2)', background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))' }}>
            <div>
              <p className="stat-label">Suspended</p>
              <p className="stat-value text-danger">{teachers.filter(t => t.status === 'suspended').length}</p>
            </div>
            <div className="stat-icon text-danger" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
              <Ban style={{ height: '1.75rem', width: '1.75rem' }} />
            </div>
          </GlassCard>
        </div>

        <div className="d-flex flex-col gap-6">
          <GlassCard className="d-flex flex-col p-0 shadow-sm" style={{ overflow: 'hidden' }}>
            <div className="p-5 border-b border-white/5 d-flex flex-wrap items-center justify-between gap-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <h3 className="font-bold d-flex items-center gap-3">
                <div className="stat-icon text-primary" style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem' }}><User style={{ height: '1rem', width: '1rem' }} /></div> 
                Teacher Directory
              </h3>
              <div className="relative" style={{ width: '100%', maxWidth: '18rem' }}>
                <Search className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', height: '1.25rem', width: '1.25rem' }} />
                <input 
                  type="text" 
                  placeholder="Search teachers..." 
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                />
              </div>
            </div>
            
            <div className="p-0">
              {isLoading ? (
                <div className="d-flex items-center justify-center p-12"><div className="animate-spin h-8 w-8 rounded-full" style={{ border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div></div>
              ) : teachers.length === 0 ? (
                <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                  <div className="empty-state-icon">
                    <User style={{ height: '3rem', width: '3rem', opacity: 0.5 }} />
                  </div>
                  <p className="empty-state-desc">No teachers found.</p>
                  <p className="text-sm mt-1 text-muted">Create one to get started.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="table-container p-6" style={{ display: 'none' }} id="desktop-table-view">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Teacher ID</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.map((teacher) => (
                          <tr key={teacher.id}>
                            <td className="font-bold">{teacher.full_name}</td>
                            <td className="font-mono text-muted">{teacher.username}</td>
                            <td>
                              <span className={`badge ${teacher.status === 'suspended' ? 'badge-danger' : 'badge-success'}`}>
                                {teacher.status === 'suspended' ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="d-flex justify-end gap-2">
                                <GlassButton 
                                  variant="ghost" 
                                  className="btn-icon"
                                  onClick={() => openManageModal(teacher, 'edit')}
                                  title="Edit Teacher"
                                >
                                  <Edit style={{ height: '1rem', width: '1rem' }} />
                                </GlassButton>
                                <GlassButton 
                                  variant="ghost" 
                                  className="btn-icon"
                                  onClick={() => openManageModal(teacher, 'reset')}
                                  title="Reset Password"
                                >
                                  <KeyRound style={{ height: '1rem', width: '1rem' }} />
                                </GlassButton>
                                <GlassButton 
                                  variant="ghost" 
                                  className="btn-icon"
                                  style={teacher.status === 'suspended' ? { color: 'var(--color-success)' } : { color: 'var(--color-warning)' }}
                                  onClick={() => openManageModal(teacher, 'suspend')}
                                  title={teacher.status === 'suspended' ? "Restore Access" : "Suspend Access"}
                                >
                                  {teacher.status === 'suspended' ? <CheckCircle2 style={{ height: '1rem', width: '1rem' }} /> : <Ban style={{ height: '1rem', width: '1rem' }} />}
                                </GlassButton>
                                <GlassButton 
                                  variant="ghost" 
                                  className="btn-icon text-danger"
                                  onClick={() => openManageModal(teacher, 'delete')}
                                  title="Delete Teacher"
                                >
                                  <Trash2 style={{ height: '1rem', width: '1rem' }} />
                                </GlassButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="d-flex flex-col" id="mobile-cards-view">
                    <style>{`
                      @media (min-width: 768px) {
                        #desktop-table-view { display: block !important; }
                        #mobile-cards-view { display: none !important; }
                      }
                    `}</style>
                    {teachers.map((teacher) => (
                      <div key={teacher.id} className="p-5 border-b border-white/5 hover-bg-white-10 transition-all d-flex flex-col gap-4">
                        <div className="d-flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg">{teacher.full_name}</h4>
                            <p className="text-sm font-mono text-muted mt-0.5">{teacher.username}</p>
                          </div>
                          <span className={`badge ${teacher.status === 'suspended' ? 'badge-danger' : 'badge-success'}`}>
                            {teacher.status === 'suspended' ? 'Suspended' : 'Active'}
                          </span>
                        </div>
                        
                        <div className="d-flex gap-2 pt-2 border-t border-white/5 flex-wrap">
                          <GlassButton 
                            variant="ghost" 
                            className="text-xs font-bold d-flex items-center justify-center"
                            style={{ flex: 1, minWidth: '45%' }}
                            onClick={() => openManageModal(teacher, 'edit')}
                          >
                            <Edit style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} /> Edit
                          </GlassButton>
                          <GlassButton 
                            variant="ghost" 
                            className="text-xs font-bold d-flex items-center justify-center"
                            style={{ flex: 1, minWidth: '45%' }}
                            onClick={() => openManageModal(teacher, 'reset')}
                          >
                            <KeyRound style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} /> Password
                          </GlassButton>
                          <GlassButton 
                            variant="ghost" 
                            className="text-xs font-bold d-flex items-center justify-center"
                            style={{ flex: 1, minWidth: '45%', color: teacher.status === 'suspended' ? 'var(--color-success)' : 'var(--color-warning)' }}
                            onClick={() => openManageModal(teacher, 'suspend')}
                          >
                            {teacher.status === 'suspended' ? <CheckCircle2 style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} /> : <Ban style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />}
                            {teacher.status === 'suspended' ? 'Restore' : 'Suspend'}
                          </GlassButton>
                          <GlassButton 
                            variant="ghost" 
                            className="text-xs font-bold d-flex items-center justify-center text-danger"
                            style={{ flex: 1, minWidth: '45%', background: 'rgba(239,68,68,0.1)' }}
                            onClick={() => openManageModal(teacher, 'delete')}
                          >
                            <Trash2 style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} /> Delete
                          </GlassButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </div>

        <footer style={{ padding: 'var(--space-6) 0 var(--space-4)', textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-muted-foreground)', marginTop: 'auto' }}>
          © {new Date().getFullYear()} Shah Muhammed Sab.<br/>
          This website is created by AWO community. All rights reserved.
        </footer>
      </div>

      {/* Create Teacher Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '100%', maxWidth: '28rem' }}
            >
              <GlassCard className="modal-content">
                <h2 className="modal-title mb-6">Create New Teacher</h2>

                {error && (
                  <div className="p-4 rounded-xl text-sm font-bold mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleCreateTeacher} className="d-flex flex-col gap-5">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Full Name</label>
                    <GlassInput 
                      type="text" 
                      placeholder="Jane Smith" 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Teacher ID (Username)</label>
                    <GlassInput 
                      type="text" 
                      placeholder="teacher123" 
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Temporary Password</label>
                    <GlassInput 
                      type="password" 
                      placeholder="••••••••" 
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
                    <GlassButton 
                      type="button" 
                      variant="ghost" 
                      style={{ flex: 1 }} 
                      onClick={() => { setIsCreating(false); setError(null); }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton 
                      type="submit" 
                      variant="primary" 
                      className="shadow-sm font-bold"
                      style={{ flex: 1 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Teacher'}
                    </GlassButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Teacher Modal */}
      <AnimatePresence>
        {manageAction && selectedTeacher && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '100%', maxWidth: '28rem' }}
            >
              <GlassCard className="modal-content">
                <h2 className="modal-title mb-2">
                  {manageAction === 'edit' && 'Edit Teacher'}
                  {manageAction === 'reset' && 'Reset Password'}
                  {manageAction === 'suspend' && (selectedTeacher.status === 'suspended' ? 'Restore Access' : 'Suspend Access')}
                  {manageAction === 'delete' && 'Delete Teacher'}
                </h2>
                
                <p className="text-sm font-medium text-muted mb-6">
                  {manageAction === 'edit' && `Update details for ${selectedTeacher.full_name}.`}
                  {manageAction === 'reset' && `Set a new password for ${selectedTeacher.full_name} (${selectedTeacher.username}).`}
                  {manageAction === 'suspend' && `Are you sure you want to ${selectedTeacher.status === 'suspended' ? 'restore' : 'suspend'} access for ${selectedTeacher.full_name}?`}
                  {manageAction === 'delete' && `Are you sure you want to permanently delete ${selectedTeacher.full_name}? This action cannot be undone.`}
                </p>

                {error && (
                  <div className="p-4 rounded-xl text-sm font-bold mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleManageAction} className="d-flex flex-col gap-5">
                  {manageAction === 'edit' && (
                    <>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Full Name</label>
                        <GlassInput 
                          type="text" 
                          required
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Teacher ID (Username)</label>
                        <GlassInput 
                          type="text" 
                          required
                          value={editUsername}
                          onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        />
                      </div>
                    </>
                  )}

                  {manageAction === 'reset' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">New Password</label>
                      <GlassInput 
                        type="password" 
                        placeholder="••••••••" 
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
                    <GlassButton 
                      type="button" 
                      variant="ghost" 
                      style={{ flex: 1 }} 
                      onClick={closeManageModal}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton 
                      type="submit" 
                      variant={manageAction === 'delete' || manageAction === 'suspend' ? 'danger' : 'primary'} 
                      className="shadow-sm font-bold"
                      style={{ flex: 1 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : 'Confirm'}
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
