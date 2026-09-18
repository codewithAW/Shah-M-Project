import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PlayCircle, CheckSquare, Clock, ArrowRight } from 'lucide-react';
import { courseService } from '../../services/courseService';
import { lectureService } from '../../services/lectureService';
import { enrollmentService } from '../../services/enrollmentService';
import { useAuth } from '../../hooks/useAuth';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassBadge } from '../../components/ui/GlassBadge';
import type { Course, Lecture } from '../../types';
import Swal from 'sweetalert2';


export function CourseDetails() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    
    async function loadCourseData() {
      setError(null);
      setIsLoading(true);
      try {
        let courseData;
        if (profile && (profile.role === 'teacher' || profile.role === 'admin')) {
          courseData = await courseService.getCourseById(courseId!);
        } else {
          courseData = await courseService.getPublishedCourseById(courseId!);
        }
        setCourse(courseData);
        
        let lecturesData;
        if (profile && (profile.role === 'teacher' || profile.role === 'admin')) {
          // If needed, we could fetch all lectures including drafts here
          lecturesData = await lectureService.getPublishedLectures(courseId!);
        } else {
          lecturesData = await lectureService.getPublishedLectures(courseId!);
        }
        setLectures(lecturesData);
        
        if (user) {
          const enrollment = await enrollmentService.checkEnrollment(courseId!, user.id);
          setIsEnrolled(enrollment?.status === 'active');
          setEnrollmentStatus(enrollment?.status || null);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCourseData();
  }, [courseId, user, profile]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    
    setIsEnrolling(true);
    try {
      const enrollment = await enrollmentService.enroll(courseId!, user.id);
      setEnrollmentStatus(enrollment.status);
      setIsEnrolled(enrollment.status === 'active');
      
      if (enrollment.status === 'active') {
        navigate('/dashboard');
      } else {
        Swal.fire("Enrollment requested. Please wait for teacher approval.");
      }
    } catch (err: any) {
      Swal.fire(`Error enrolling: ${err.message}`);
      setIsEnrolling(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  if (error || !course) return <div className="p-10 text-center text-error bg-error/10 glass-panel max-w-2xl mx-auto my-10">Failed to load course details.</div>;

  const teacher = (course as any).profiles;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 lg:py-24 overflow-hidden border-b border-glass-highlight">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 -z-10"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl -translate-y-1/2 translate-x-1/3 -z-10"></div>
        
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex gap-2 items-center">
              <GlassBadge variant="default" className="capitalize text-xs">{(course as any).course_categories?.name || 'Uncategorized'}</GlassBadge>
              <GlassBadge variant="primary" className="capitalize text-xs">{course.difficulty}</GlassBadge>
              {course.status !== 'published' && (
                <GlassBadge variant="warning" className="capitalize text-xs">Preview ({course.status})</GlassBadge>
              )}
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">{course.title}</h1>
            <p className="text-lg text-muted-foreground max-w-xl">{course.short_description || course.description}</p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/20 overflow-hidden text-primary flex items-center justify-center font-bold">
                  {teacher?.avatar_url ? <img src={teacher.avatar_url} alt="" className="w-full h-full object-cover"/> : (teacher?.full_name?.substring(0, 2).toUpperCase() || 'T')}
                </div>
                <span>By {teacher?.full_name || 'Instructor'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" /> {course.estimated_duration || 'Self-paced'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <PlayCircle className="h-4 w-4" /> {lectures.length} Lectures
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              {isEnrolled ? (
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <Link to="/dashboard">
                    <GlassButton variant="primary" size="lg" className="w-full sm:w-auto px-10 gap-2">
                      <CheckSquare className="h-5 w-5" /> Continue Learning
                    </GlassButton>
                  </Link>
                  {course.slug === 'compiler-construction' && (
                    <Link to="/courses/compiler-construction">
                      <GlassButton variant="primary" size="lg" className="w-full sm:w-auto px-6 gap-2 bg-accent/20 border-accent/50 hover:bg-accent/30 text-accent">
                        Open Compiler Construction Website <ArrowRight className="h-5 w-5" />
                      </GlassButton>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <GlassButton 
                    variant="primary" 
                    size="lg" 
                    className="w-full sm:w-auto px-10" 
                    onClick={handleEnroll} 
                    disabled={isEnrolling || enrollmentStatus === 'pending'}
                  >
                    {isEnrolling ? 'Enrolling...' : enrollmentStatus === 'pending' ? 'Pending Approval' : 'Enroll Now'}
                  </GlassButton>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="aspect-video rounded-3xl overflow-hidden glass-panel relative shadow-2xl ring-1 ring-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 z-0"></div>
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover z-10 relative opacity-90 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <PlayCircle className="h-20 w-20 text-white/50 group-hover:text-white/80 transition-colors group-hover:scale-110 duration-300" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Course Content Sections */}
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* About Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6">About this course</h2>
            <div className="glass-panel p-8 rounded-3xl">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {course.description || "No full description provided for this course."}
              </p>
            </div>
          </section>

          {/* Curriculum */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Curriculum</h2>
              <span className="text-sm font-medium text-muted-foreground bg-glass px-3 py-1 rounded-full">
                {lectures.length} Lectures
              </span>
            </div>
            
            <div className="space-y-4">
              {lectures.length === 0 ? (
                <p className="text-muted-foreground italic">Lectures are being prepared for this course.</p>
              ) : (
                lectures.map((lecture, index) => (
                  <GlassCard key={lecture.id} className="p-4 sm:p-6 group hover:border-primary/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 mt-1 sm:mt-0">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold">{lecture.title}</h4>
                          {lecture.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lecture.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 sm:ml-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {lecture.duration || '00:00'}
                        </div>
                        {isEnrolled ? (
                          <Link to={`/lecture/${lecture.id}`}>
                            <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                              <PlayCircle className="h-5 w-5 text-primary" />
                            </GlassButton>
                          </Link>
                        ) : (
                          <div className="h-8 w-8 flex items-center justify-center opacity-30">
                            <PlayCircle className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <GlassCard className="p-6 sticky top-24">
            <h3 className="text-lg font-bold mb-4 border-b border-glass-highlight pb-2">Instructor</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center font-bold text-xl text-primary shrink-0">
                {teacher?.avatar_url ? <img src={teacher.avatar_url} alt="" className="w-full h-full object-cover"/> : (teacher?.full_name?.substring(0, 2).toUpperCase() || 'T')}
              </div>
              <div>
                <h4 className="font-bold">{teacher?.full_name || 'Instructor'}</h4>
                <p className="text-xs text-muted-foreground capitalize">Teacher</p>
              </div>
            </div>
            
            <div className="space-y-3 mt-6 pt-4 border-t border-glass-highlight text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enrolled Students</span>
                <span className="font-medium">...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Lessons</span>
                <span className="font-medium">{lectures.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="font-medium">English</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
