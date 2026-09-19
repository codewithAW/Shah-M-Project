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
    <div className="course-details-container">
      {/* Hero Section */}
      <section className="course-details-hero">
        <div className="course-details-hero-bg"></div>
        <div className="course-details-hero-glow"></div>
        
        <div className="course-details-grid">
          <div className="course-details-info">
            <div className="course-details-badges">
              <GlassBadge variant="default" style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-xs)' }}>
                {(course as any).course_categories?.name || 'Uncategorized'}
              </GlassBadge>
              <GlassBadge variant="primary" style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-xs)' }}>{course.difficulty}</GlassBadge>
              {course.status !== 'published' && (
                <GlassBadge variant="warning" style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-xs)' }}>Preview ({course.status})</GlassBadge>
              )}
            </div>
            
            <h1 className="course-details-title">{course.title}</h1>
            <p className="course-details-desc">{course.short_description || course.description}</p>
            
            <div className="course-details-meta">
              <div className="course-details-instructor">
                <div className="course-details-instructor-avatar">
                  {teacher?.avatar_url ? <img src={teacher.avatar_url} alt="" /> : (teacher?.full_name?.substring(0, 2).toUpperCase() || 'T')}
                </div>
                <span>By {teacher?.full_name || 'Instructor'}</span>
              </div>
              <div className="course-details-meta-item">
                <Clock className="h-4 w-4" /> {course.estimated_duration || 'Self-paced'}
              </div>
              {isEnrolled && lectures.length > 0 ? (
                <Link 
                  to={`/lecture/${lectures[0].id}`}
                  className="course-details-meta-item" 
                  style={{ textDecoration: 'none', transition: 'color 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-muted-foreground)'}
                >
                  <PlayCircle className="h-4 w-4" /> {lectures.length} Lectures
                </Link>
              ) : (
                <div 
                  className="course-details-meta-item" 
                  style={{ cursor: 'pointer', transition: 'color 0.2s ease' }}
                  onClick={() => {
                    document.getElementById('curriculum')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-muted-foreground)'}
                >
                  <PlayCircle className="h-4 w-4" /> {lectures.length} Lectures
                </div>
              )}
            </div>
            
            <div className="course-details-actions">
              {isEnrolled ? (
                <>
                  {course.external_link ? (
                    <a href={course.external_link} target={course.external_link.startsWith('http') ? "_blank" : "_self"} rel="noopener noreferrer" style={{ textDecoration: 'none', width: '100%' }}>
                      <GlassButton variant="primary" size="lg" style={{ width: '100%' }}>
                        <CheckSquare className="h-5 w-5 mr-2" /> Continue Learning
                      </GlassButton>
                    </a>
                  ) : (
                    <Link to={course.slug === 'compiler-construction' ? '/courses/compiler-construction' : (lectures.length > 0 ? `/lecture/${lectures[0].id}` : '/dashboard')}>
                      <GlassButton variant="primary" size="lg" style={{ width: '100%' }}>
                        <CheckSquare className="h-5 w-5 mr-2" /> Continue Learning
                      </GlassButton>
                    </Link>
                  )}
                  {course.slug === 'compiler-construction' && (
                    <Link to="/courses/compiler-construction">
                      <GlassButton variant="secondary" size="lg" style={{ width: '100%' }}>
                        Open Compiler Construction Website <ArrowRight className="h-5 w-5 ml-2" />
                      </GlassButton>
                    </Link>
                  )}
                </>
              ) : (
                <GlassButton 
                  variant="primary" 
                  size="lg" 
                  style={{ width: '100%' }}
                  onClick={handleEnroll} 
                  disabled={isEnrolling || enrollmentStatus === 'pending'}
                >
                  {isEnrolling ? 'Enrolling...' : enrollmentStatus === 'pending' ? 'Pending Approval' : 'Enroll Now'}
                </GlassButton>
              )}
            </div>
          </div>
          
          <div className="course-details-media">
            <div className="course-details-media-glow" />
            {isEnrolled && lectures.length > 0 ? (
              <Link to={`/lecture/${lectures[0].id}`} className="block">
                <div className="course-details-media-card group cursor-pointer">
                  <div className="course-details-media-bg"></div>
                  {course.thumbnail_url ? (
                    <div className="relative w-full h-full">
                      <img src={course.thumbnail_url} alt={course.title} className="course-details-media-img" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[var(--radius-2xl)]">
                        <div className="h-20 w-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                          <PlayCircle className="h-10 w-10 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="course-details-media-icon">
                      <PlayCircle />
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div 
                className="course-details-media-card group cursor-pointer"
                onClick={() => {
                  document.getElementById('curriculum')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="course-details-media-bg"></div>
                {course.thumbnail_url ? (
                  <div className="relative w-full h-full">
                    <img src={course.thumbnail_url} alt={course.title} className="course-details-media-img" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[var(--radius-2xl)]">
                      <div className="h-20 w-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <PlayCircle className="h-10 w-10 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="course-details-media-icon">
                    <PlayCircle />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Course Content Sections */}
      <div className="course-details-content-grid">
        <div className="course-details-main">
          {/* About Section */}
          <section>
            <h2 className="course-details-section-title">About this course</h2>
            <div className="glass-card course-details-about">
              {course.description || "No full description provided for this course."}
            </div>
          </section>

          {/* Curriculum */}
          <section id="curriculum">
            <div className="course-details-curriculum-header">
              <h2 className="course-details-section-title" style={{ marginBottom: 0 }}>Curriculum</h2>
              <span className="course-details-curriculum-count">
                {lectures.length} Lectures
              </span>
            </div>
            
            <div className="course-details-lecture-list">
              {lectures.length === 0 ? (
                <p className="text-muted">Lectures are being prepared for this course.</p>
              ) : (
                lectures.map((lecture, index) => (
                  <GlassCard key={lecture.id} className="course-details-lecture-card">
                    <div className="course-details-lecture-layout">
                      <div className="course-details-lecture-info">
                        <div className="course-details-lecture-number">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="course-details-lecture-title">{lecture.title}</h4>
                          {lecture.subject && (
                            <GlassBadge variant="primary" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>{lecture.subject}</GlassBadge>
                          )}
                          {lecture.description && (
                            <p className="course-details-lecture-desc">{lecture.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="course-details-lecture-actions">
                        <div className="course-details-lecture-time">
                          <Clock className="h-3.5 w-3.5" />
                          {lecture.duration || '00:00'}
                        </div>
                        {isEnrolled ? (
                          <Link to={`/lecture/${lecture.id}`}>
                            <GlassButton variant="ghost" size="icon" className="course-details-lecture-play">
                              <PlayCircle style={{ height: '1.25rem', width: '1.25rem' }} className="text-primary" />
                            </GlassButton>
                          </Link>
                        ) : (
                          <div className="course-details-lecture-play" style={{ opacity: 0.3 }}>
                            <PlayCircle style={{ height: '1.25rem', width: '1.25rem' }} />
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
        <div className="course-details-sidebar">
          <GlassCard className="course-details-sidebar-card">
            <h3 className="course-details-sidebar-title">Instructor</h3>
            <div className="course-details-sidebar-instructor">
              <div className="course-details-sidebar-avatar">
                {teacher?.avatar_url ? <img src={teacher.avatar_url} alt="" /> : (teacher?.full_name?.substring(0, 2).toUpperCase() || 'T')}
              </div>
              <div>
                <h4 className="course-details-sidebar-instructor-name">{teacher?.full_name || 'Instructor'}</h4>
                <p className="course-details-sidebar-instructor-role">Teacher</p>
              </div>
            </div>
            
            <div className="course-details-sidebar-stats">
              <div className="course-details-sidebar-stat">
                <span className="course-details-sidebar-stat-label">Enrolled Students</span>
                <span className="course-details-sidebar-stat-value">...</span>
              </div>
              <div className="course-details-sidebar-stat">
                <span className="course-details-sidebar-stat-label">Total Lessons</span>
                <span className="course-details-sidebar-stat-value">{lectures.length}</span>
              </div>
              <div className="course-details-sidebar-stat">
                <span className="course-details-sidebar-stat-label">Language</span>
                <span className="course-details-sidebar-stat-value">English</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
