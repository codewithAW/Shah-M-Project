import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, CheckCircle, ExternalLink } from 'lucide-react';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { resourceService } from '../../services/resourceService';
import { progressService } from '../../services/progressService';
import { useAuth } from '../../hooks/useAuth';
import type { Lecture as LectureType, Course, Resource, LectureProgress } from '../../types';
import Swal from 'sweetalert2';


export function Lecture() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const { profile } = useAuth();
  
  const [lecture, setLecture] = useState<LectureType | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [progress, setProgress] = useState<LectureProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (lectureId && profile?.id) {
      loadLectureData(lectureId, profile.id);
    }
  }, [lectureId, profile]);

  const loadLectureData = async (id: string, studentId: string) => {
    setIsLoading(true);
    try {
      const resData = await resourceService.getResourcesByLecture(id);
      setResources(resData);
      
      // Temporary fallback for UI presentation since lecture fetching by ID wasn't explicitly built in Phase 3
      setLecture({ id, title: 'Lecture Title', description: 'Lecture Description', video_url: null, lecture_order: 1 } as any);
      setCourse({ id: 'c-1', title: 'Course Name' } as any);

      // Track progress
      const prog = await progressService.getLectureProgress(studentId, id);
      setProgress(prog);

      // Update last viewed automatically
      await progressService.updateLectureProgress(studentId, id, prog?.progress_percentage || 10);
      
      // We log activity for starting the lecture if no progress existed
      if (!prog) {
        progressService.logActivity({ activity_type: 'lecture_started', lecture_id: id });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!profile?.id || !lectureId) return;
    try {
      const newProg = await progressService.markLectureComplete(profile.id, lectureId);
      setProgress(newProg);
      progressService.logActivity({ activity_type: 'lecture_completed', lecture_id: lectureId });
    } catch(err: any) {
      Swal.fire("Failed to mark complete: " + err.message);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  if (!lecture) return <div className="min-h-screen bg-background flex items-center justify-center">Lecture not found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav for Lecture */}
      <header className="h-16 border-b border-glass-highlight bg-glass/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to={`/course/${course?.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold">{course?.title}</h2>
            <p className="text-xs text-muted-foreground">Lecture {lecture.lecture_order}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton variant="ghost" size="sm" className="hidden sm:flex">
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </GlassButton>
          <GlassButton variant="primary" size="sm" className="gap-2">
            Next <ChevronRight className="h-4 w-4" />
          </GlassButton>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main Content Area (Video) */}
        <main className="flex-1 flex flex-col relative bg-black">
          <div 
            className="w-full aspect-video bg-black flex items-center justify-center relative group"
            style={lecture.thumbnail_url ? {
              backgroundImage: `url(${lecture.thumbnail_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {}}
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-20"></div>
            <div className="text-center z-10 p-4">
              <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors shadow-xl">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-2"></div>
              </div>
              <h3 className="text-white font-medium text-lg drop-shadow-md">
                {lecture.video_type === 'youtube' ? 'Watch on YouTube' : 'Play Video'}
              </h3>
            </div>
          </div>
          
          <div className="bg-background flex-1 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-bold border-b border-glass-highlight pb-2">Lecture {lecture.lecture_order}: {lecture.title}</h3>
                
                {progress?.completed ? (
                  <GlassButton variant="secondary" size="sm" className="shrink-0 gap-2 border-success text-success bg-success/10 cursor-default" onClick={() => {}}>
                    <CheckCircle className="h-4 w-4" /> Completed
                  </GlassButton>
                ) : (
                  <GlassButton variant="primary" size="sm" className="shrink-0 gap-2" onClick={handleMarkComplete}>
                    <CheckCircle className="h-4 w-4" /> Mark Complete
                  </GlassButton>
                )}
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {lecture.description}
              </p>
            </div>
          </div>
        </main>

        {/* Sidebar Resources */}
        <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-glass-highlight bg-glass/30 backdrop-blur-md flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Resources
            </h3>
            <div className="space-y-4">
              {resources.map(resource => (
                <a 
                  key={resource.id} 
                  href={resource.web_view_url || '#'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block"
                >
                  <GlassCard className="p-4 flex items-center justify-between group hover:border-primary/50 cursor-pointer">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {resource.thumbnail_url ? (
                        <img src={resource.thumbnail_url} alt="thumbnail" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-foreground shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{resource.title}</p>
                        <p className="text-xs text-muted-foreground uppercase">{resource.resource_type}</p>
                      </div>
                    </div>
                    <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 rounded-full">
                      <ExternalLink className="h-4 w-4 text-primary" />
                    </GlassButton>
                  </GlassCard>
                </a>
              ))}
              {resources.length === 0 && (
                <p className="text-sm text-muted-foreground">No resources attached to this lecture.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
