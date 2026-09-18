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
      const response = await fetch('http://localhost:3001/api/auth/create-teacher', {
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

      const response = await fetch(`http://localhost:3001${endpoint}`, {
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
    <div className="min-h-screen bg-background relative text-foreground">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full filter blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full filter blur-3xl -translate-x-1/3 translate-y-1/3"></div>
      </div>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 glass-panel border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <GlassButton variant="ghost" className="text-sm px-3 py-1.5 h-auto text-muted-foreground hover:text-foreground" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </GlassButton>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Management</h1>
            <p className="text-muted-foreground mt-1">Create, edit, suspend, and delete teacher accounts.</p>
          </div>
          <GlassButton 
            variant="primary" 
            onClick={() => setIsCreating(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Teacher
          </GlassButton>
        </div>

        {error && !isCreating && !manageAction && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassCard className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Teachers</p>
              <p className="text-3xl font-bold mt-1">{teachers.length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-6 w-6" />
            </div>
          </GlassCard>
          <GlassCard className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-3xl font-bold mt-1 text-green-500">{teachers.filter(t => t.status !== 'suspended').length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </GlassCard>
          <GlassCard className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Suspended</p>
              <p className="text-3xl font-bold mt-1 text-error">{teachers.filter(t => t.status === 'suspended').length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-error/10 flex items-center justify-center text-error">
              <Ban className="h-6 w-6" />
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-glass-border flex flex-col sm:flex-row sm:items-center justify-between bg-black/10 gap-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Teacher Directory
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search teachers..." 
                  className="w-full pl-9 pr-4 py-2 text-sm bg-background/50 border border-glass-border rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            
            <div className="p-0">
              {isLoading ? (
                <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
              ) : teachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-muted-foreground">
                  <User className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg">No teachers found.</p>
                  <p className="text-sm mt-1">Create one to get started.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-black/5 border-b border-glass-border">
                        <tr>
                          <th className="px-6 py-4 font-medium">Name</th>
                          <th className="px-6 py-4 font-medium">Teacher ID</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass-border/50">
                        {teachers.map((teacher) => (
                          <tr key={teacher.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-medium">{teacher.full_name}</td>
                            <td className="px-6 py-4 font-mono text-muted-foreground">{teacher.username}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                teacher.status === 'suspended' 
                                  ? 'bg-error/10 text-error border-error/20' 
                                  : 'bg-green-500/10 text-green-500 border-green-500/20'
                              }`}>
                                {teacher.status === 'suspended' ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <GlassButton 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary transition-colors"
                                  onClick={() => openManageModal(teacher, 'edit')}
                                  title="Edit Teacher"
                                >
                                  <Edit className="h-4 w-4" />
                                </GlassButton>
                                <GlassButton 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary transition-colors"
                                  onClick={() => openManageModal(teacher, 'reset')}
                                  title="Reset Password"
                                >
                                  <KeyRound className="h-4 w-4" />
                                </GlassButton>
                                <GlassButton 
                                  variant="ghost" 
                                  className={`h-8 w-8 p-0 transition-colors ${teacher.status === 'suspended' ? 'text-green-500 hover:bg-green-500/10' : 'text-warning hover:bg-warning/10 hover:text-warning'}`}
                                  onClick={() => openManageModal(teacher, 'suspend')}
                                  title={teacher.status === 'suspended' ? "Restore Access" : "Suspend Access"}
                                >
                                  {teacher.status === 'suspended' ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                </GlassButton>
                                <GlassButton 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-error hover:bg-error/10 hover:text-error transition-colors"
                                  onClick={() => openManageModal(teacher, 'delete')}
                                  title="Delete Teacher"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </GlassButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="md:hidden flex flex-col divide-y divide-glass-border/50">
                    {teachers.map((teacher) => (
                      <div key={teacher.id} className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-base">{teacher.full_name}</h4>
                            <p className="text-sm font-mono text-muted-foreground mt-0.5">{teacher.username}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                            teacher.status === 'suspended' 
                              ? 'bg-error/10 text-error border-error/20' 
                              : 'bg-green-500/10 text-green-500 border-green-500/20'
                          }`}>
                            {teacher.status === 'suspended' ? 'Suspended' : 'Active'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-glass-border/30">
                          <GlassButton 
                            variant="ghost" 
                            className="flex-1 min-w-[45%] text-xs h-9 justify-center bg-white/5"
                            onClick={() => openManageModal(teacher, 'edit')}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                          </GlassButton>
                          <GlassButton 
                            variant="ghost" 
                            className="flex-1 min-w-[45%] text-xs h-9 justify-center bg-white/5"
                            onClick={() => openManageModal(teacher, 'reset')}
                          >
                            <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Password
                          </GlassButton>
                          <GlassButton 
                            variant="ghost" 
                            className={`flex-1 min-w-[45%] text-xs h-9 justify-center bg-white/5 ${teacher.status === 'suspended' ? 'text-green-500' : 'text-warning'}`}
                            onClick={() => openManageModal(teacher, 'suspend')}
                          >
                            {teacher.status === 'suspended' ? <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> : <Ban className="h-3.5 w-3.5 mr-1.5" />}
                            {teacher.status === 'suspended' ? 'Restore' : 'Suspend'}
                          </GlassButton>
                          <GlassButton 
                            variant="ghost" 
                            className="flex-1 min-w-[45%] text-xs h-9 justify-center bg-error/10 text-error hover:bg-error/20"
                            onClick={() => openManageModal(teacher, 'delete')}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
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
      </div>

      {/* Create Teacher Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold mb-6">Create New Teacher</h2>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCreateTeacher} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 ml-1">Full Name</label>
                    <GlassInput 
                      type="text" 
                      placeholder="Jane Smith" 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 ml-1">Teacher ID (Username)</label>
                    <GlassInput 
                      type="text" 
                      placeholder="teacher123" 
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 ml-1">Temporary Password</label>
                    <GlassInput 
                      type="password" 
                      placeholder="••••••••" 
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <GlassButton 
                      type="button" 
                      variant="ghost" 
                      className="flex-1" 
                      onClick={() => { setIsCreating(false); setError(null); }}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold mb-2">
                  {manageAction === 'edit' && 'Edit Teacher'}
                  {manageAction === 'reset' && 'Reset Password'}
                  {manageAction === 'suspend' && (selectedTeacher.status === 'suspended' ? 'Restore Access' : 'Suspend Access')}
                  {manageAction === 'delete' && 'Delete Teacher'}
                </h2>
                
                <p className="text-sm text-muted-foreground mb-6">
                  {manageAction === 'edit' && `Update details for ${selectedTeacher.full_name}.`}
                  {manageAction === 'reset' && `Set a new password for ${selectedTeacher.full_name} (${selectedTeacher.username}).`}
                  {manageAction === 'suspend' && `Are you sure you want to ${selectedTeacher.status === 'suspended' ? 'restore' : 'suspend'} access for ${selectedTeacher.full_name}?`}
                  {manageAction === 'delete' && `Are you sure you want to permanently delete ${selectedTeacher.full_name}? This action cannot be undone.`}
                </p>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleManageAction} className="space-y-4">
                  {manageAction === 'edit' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 ml-1">Full Name</label>
                        <GlassInput 
                          type="text" 
                          required
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 ml-1">Teacher ID (Username)</label>
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
                    <div>
                      <label className="block text-sm font-medium mb-1.5 ml-1">New Password</label>
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

                  <div className="flex gap-3 pt-4">
                    <GlassButton 
                      type="button" 
                      variant="ghost" 
                      className="flex-1" 
                      onClick={closeManageModal}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton 
                      type="submit" 
                      variant={manageAction === 'delete' || manageAction === 'suspend' ? 'danger' : 'primary'} 
                      className="flex-1"
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
