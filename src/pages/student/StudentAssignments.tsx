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
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">My Assignments</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage assignments across all your courses.</p>
      </div>

      {assignments.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-semibold mb-1">No assignments available</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">You do not have any assignments due at the moment.</p>
        </GlassCard>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedAssignments).map(([courseTitle, courseAssignments]) => (
            <div key={courseTitle} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold">{courseTitle}</h2>
                <GlassBadge>{courseAssignments.length} items</GlassBadge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseAssignments.map((assignment) => {
                  const isClosed = assignment.due_date ? new Date() > new Date(assignment.due_date) : false;
                  const status = submissionMap[assignment.id] || 'not_submitted';
                  
                  return (
                    <GlassCard key={assignment.id} className="p-5 flex flex-col">
                      <div className="mb-4">
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <h3 className="font-semibold text-sm leading-snug line-clamp-2" title={assignment.title}>
                            {assignment.title}
                          </h3>
                          <GlassBadge 
                            variant={status === 'graded' ? 'success' : status === 'not_submitted' ? (isClosed ? 'error' : 'warning') : 'primary'}
                            className="text-[10px] uppercase shrink-0"
                          >
                            {isClosed && status === 'not_submitted' ? 'Closed' : status.replace('_', ' ')}
                          </GlassBadge>
                        </div>
                        
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span className={isClosed ? 'text-error font-medium' : ''}>
                              {assignment.due_date 
                                ? `${isClosed ? 'Past Due: ' : 'Due: '}${new Date(assignment.due_date).toLocaleDateString()}`
                                : 'No due date'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{assignment.max_marks} Points</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-border">
                        <Link to={`/assignment/${assignment.id}`}>
                          <GlassButton 
                            variant={status === 'not_submitted' && !isClosed ? 'primary' : 'secondary'} 
                            size="sm" 
                            className="w-full"
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
