import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertCircle, Calendar } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassBadge } from '../../components/ui/GlassBadge';
import { assignmentService } from '../../services/assignmentService';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import type { Assignment } from '../../types';

export function StudentAssignments() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionMap, setSubmissionMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!profile?.id) return;
      try {
        const data = await assignmentService.getMyAssignments();
        setAssignments(data);

        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('assignment_id, status')
          .eq('student_id', profile.id);

        if (submissions) {
          const map: Record<string, string> = {};
          submissions.forEach(sub => {
            map[sub.assignment_id] = sub.status;
          });
          setSubmissionMap(map);
        }
      } catch (err) {
        console.error("Error loading assignments", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [profile]);

  if (isLoading) {
    return (
      <div className="d-flex justify-center items-center" style={{ minHeight: '50vh' }}>
        <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // Group by course title
  const groupedAssignments: Record<string, Assignment[]> = {};
  assignments.forEach(assignment => {
    // @ts-ignore
    const courseTitle = assignment.courses?.title || 'Unknown Course';
    if (!groupedAssignments[courseTitle]) {
      groupedAssignments[courseTitle] = [];
    }
    groupedAssignments[courseTitle].push(assignment);
  });

  return (
    <div className="d-flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h1 className="dashboard-title text-2xl font-bold">My Assignments</h1>
        <p className="text-sm text-muted mt-1">View and manage assignments across all your courses.</p>
      </div>

      {assignments.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <FileText className="mx-auto mb-3 text-muted" style={{ height: '2.5rem', width: '2.5rem', opacity: 0.3 }} />
          <h3 className="font-semibold mb-1">No assignments available</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">You do not have any assignments due at the moment.</p>
        </GlassCard>
      ) : (
        <div className="d-flex flex-col gap-10">
          {Object.entries(groupedAssignments).map(([courseTitle, courseAssignments]) => (
            <div key={courseTitle} className="d-flex flex-col gap-6">
              <div className="d-flex items-center gap-4 pb-4 border-b border-white/5">
                <div className="stat-icon text-primary shadow-sm" style={{ width: '3rem', height: '3rem', borderRadius: '1rem', border: '1px solid rgba(var(--color-primary-rgb), 0.1)' }}>
                  <FileText style={{ height: '1.5rem', width: '1.5rem' }} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">{courseTitle}</h2>
                <GlassBadge className="shadow-sm" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>{courseAssignments.length} items</GlassBadge>
              </div>

              <div className="dashboard-grid cols-3">
                {courseAssignments.map((assignment) => {
                  const isClosed = assignment.due_date ? new Date() > new Date(assignment.due_date) : false;
                  const status = submissionMap[assignment.id] || 'not_submitted';
                  
                  return (
                    <GlassCard key={assignment.id} className="d-flex flex-col p-6 hover-float transition-all">
                      <div className="mb-5">
                        <div className="d-flex justify-between items-start gap-4 mb-4">
                          <h3 className="font-semibold text-base leading-snug tracking-tight" title={assignment.title} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {assignment.title}
                          </h3>
                          <GlassBadge 
                            variant={status === 'graded' ? 'success' : status === 'not_submitted' ? (isClosed ? 'danger' : 'warning') : 'primary'}
                            className="text-xs uppercase font-bold shadow-sm"
                            style={{ flexShrink: 0 }}
                          >
                            {isClosed && status === 'not_submitted' ? 'Closed' : status.replace('_', ' ')}
                          </GlassBadge>
                        </div>
                        
                        <div className="d-flex flex-col gap-2 text-xs text-muted font-medium">
                          <div className="d-flex items-center gap-2">
                            <Calendar style={{ height: '1rem', width: '1rem', opacity: 0.7 }} />
                            <span className={isClosed ? 'text-danger font-bold' : ''}>
                              {assignment.due_date 
                                ? `${isClosed ? 'Past Due: ' : 'Due: '}${new Date(assignment.due_date).toLocaleDateString()}`
                                : 'No due date'
                              }
                            </span>
                          </div>
                          <div className="d-flex items-center gap-2">
                            <AlertCircle style={{ height: '1rem', width: '1rem', opacity: 0.7 }} />
                            <span>{assignment.max_marks} Points</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-5 border-t border-white/5">
                        <Link to={`/assignment/${assignment.id}`} style={{ textDecoration: 'none' }}>
                          <GlassButton 
                            variant={status === 'not_submitted' && !isClosed ? 'primary' : 'secondary'} 
                            size="sm" 
                            className="shadow-sm font-bold"
                            style={{ width: '100%' }}
                          >
                            {status === 'not_submitted' && !isClosed ? 'Start Assignment' : 'View Details'}
                          </GlassButton>
                        </Link>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
