import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Clock, User, CheckCircle, FileText, ExternalLink, PlayCircle, Info, Code, PlaySquare } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { progressService } from '../../services/progressService';
import { lectureService } from '../../services/lectureService';
import { courseService } from '../../services/courseService';
import { useAuth } from '../../hooks/useAuth';
import type { Lecture as LectureType, Course, Resource, LectureProgress } from '../../types';
import Swal from 'sweetalert2';
import '../../styles/pages/lecture.css';

const getYouTubeEmbedUrl = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

export function Lecture() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [lecture, setLecture] = useState<LectureType | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [allLectures, setAllLectures] = useState<LectureType[]>([]);
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
      const lectureData = await lectureService.getLectureById(id);
      setLecture(lectureData);

      if (lectureData?.course_id) {
        const courseData = await courseService.getCourseById(lectureData.course_id);
        setCourse(courseData);
        
        const lectures = await lectureService.getPublishedLectures(lectureData.course_id);
        setAllLectures(lectures);
      }

      const resData = await resourceService.getResourcesByLecture(id);
      setResources(resData);

      const prog = await progressService.getLectureProgress(studentId, id);
      setProgress(prog);

      await progressService.updateLectureProgress(studentId, id, prog?.progress_percentage || 10);
      
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
      Swal.fire({ title: 'Completed!', text: 'Lecture marked as complete.', icon: 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } catch(err: any) {
      Swal.fire("Failed to mark complete: " + err.message);
    }
  };

  if (isLoading) return <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!lecture) return <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Lecture not found.</div>;
  const currentIndex = allLectures.findIndex(l => l.id === lecture?.id);
  const prevLecture = currentIndex > 0 ? allLectures[currentIndex - 1] : null;
  const nextLecture = currentIndex !== -1 && currentIndex < allLectures.length - 1 ? allLectures[currentIndex + 1] : null;

  return (
    <div className="lecture-page">
      <header className="lecture-header">
        <button onClick={() => navigate(`/course/${course?.id}`)} className="lecture-btn-pill">
          <ArrowLeft size={16} /> Back to Course
        </button>
        <div className="lecture-header-actions">
          <button 
            onClick={() => prevLecture && navigate(`/lecture/${prevLecture.id}`)} 
            className="lecture-btn-pill"
            disabled={!prevLecture}
            style={{ opacity: prevLecture ? 1 : 0.5, cursor: prevLecture ? 'pointer' : 'not-allowed' }}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <button 
            onClick={() => nextLecture && navigate(`/lecture/${nextLecture.id}`)}
            className="lecture-btn-pill lecture-btn-primary"
            disabled={!nextLecture}
            style={{ opacity: nextLecture ? 1 : 0.5, cursor: nextLecture ? 'pointer' : 'not-allowed' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <div className="lecture-grid">
        <aside className="lecture-sidebar">
          
          <Link to={`/course/${course?.id}`} className="lecture-card lecture-course-info">
            <div className="lecture-course-meta">
              <div className="lecture-course-thumb">
                {course?.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt="" />
                ) : (
                  <span>C++</span>
                )}
              </div>
              <div className="lecture-course-text">
                <span className="lecture-subtitle">Lecture {lecture.lecture_order}</span>
                <h3 className="lecture-course-title">{course?.title || 'C++ Full Course for free ⚡'}</h3>
                <span className="lecture-author">Bro Code</span>
              </div>
            </div>
            <ChevronRight className="lecture-card-arrow" size={20} />
          </Link>

          <div className="lecture-card lecture-details">
            <span className="lecture-subtitle">Lecture {lecture.lecture_order}</span>
            <h2 className="lecture-title">{lecture.title} ⚡</h2>
            
            <div className="lecture-stats">
              {progress?.completed ? (
                <div className="lecture-stat-completed">
                  <CheckCircle size={16} /> Completed
                </div>
              ) : (
                <button onClick={handleMarkComplete} className="lecture-stat-btn">
                  <CheckCircle size={16} /> Mark Complete
                </button>
              )}
              
              <div className="lecture-stat-divider"></div>
              
              <div className="lecture-stat-item">
                <div className="lecture-stat-icon"><Info size={20} /></div>
                <div className="lecture-stat-text">
                  <span className="lecture-stat-label">Lecture</span>
                  <span className="lecture-stat-value">{lecture.lecture_order} of 20</span>
                </div>
              </div>
              
              <div className="lecture-stat-divider"></div>
              
              <div className="lecture-stat-item">
                <div className="lecture-stat-icon"><Clock size={20} /></div>
                <div className="lecture-stat-text">
                  <span className="lecture-stat-label">Duration</span>
                  <span className="lecture-stat-value">12:34</span>
                </div>
              </div>
              
              <div className="lecture-stat-divider" style={{ display: 'none' }}></div>
              
              <div className="lecture-stat-item">
                <div className="lecture-stat-icon"><User size={20} /></div>
                <div className="lecture-stat-text">
                  <span className="lecture-stat-label">Level</span>
                  <span className="lecture-stat-value">Beginner</span>
                </div>
              </div>
            </div>
            
            <hr className="lecture-divider" />
            
            <h3 className="lecture-section-title">
              <BookOpen size={20} /> About this lecture
            </h3>
            <p className="lecture-description">
              {lecture.description || "In this first lecture, we will set up our development environment and write our first C++ program. You will learn the basics of C++ syntax, how to use the cout statement, and understand the structure of a simple program."}
            </p>
          </div>

          <div className="lecture-card lecture-resources">
            <h3 className="lecture-section-title">
              <FileText size={20} /> Additional Resources
            </h3>
            <div className="lecture-resource-list">
              {resources.map(resource => (
                <a key={resource.id} href={resource.web_view_url || '#'} target="_blank" rel="noreferrer" className="lecture-resource-item">
                  <div className="lecture-resource-info">
                    <div className="lecture-resource-icon">
                      {resource.resource_type === 'pdf' ? 'PDF' : resource.resource_type.substring(0,3).toUpperCase()}
                    </div>
                    <div className="lecture-resource-text">
                      <h4 className="lecture-resource-title">{resource.title}</h4>
                      <span className="lecture-resource-meta">{resource.resource_type} • 1.2 MB</span>
                    </div>
                  </div>
                  <button className="lecture-btn-open">
                    Open
                  </button>
                </a>
              ))}
              {resources.length === 0 && (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>No additional resources for this lecture.</p>
              )}
            </div>
          </div>
        </aside>

        <main className="lecture-main">
          <div className="lecture-card lecture-video-card">
            <div 
              className="lecture-video-container"
              style={lecture.thumbnail_url && !(lecture.video_type === 'youtube' && lecture.video_url && getYouTubeEmbedUrl(lecture.video_url)) ? {
                backgroundImage: `url(${lecture.thumbnail_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
            >
              {lecture.video_type === 'youtube' && lecture.video_url && getYouTubeEmbedUrl(lecture.video_url) ? (
                <iframe 
                  src={getYouTubeEmbedUrl(lecture.video_url)!} 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="lecture-video-placeholder">
                  <PlayCircle className="lecture-play-icon" />
                  <h3 className="lecture-video-error">Video Unavailable</h3>
                  <p className="lecture-video-suberror">This lecture does not have a playable YouTube video attached. Please check external links.</p>
                  
                  {lecture.video_url && (
                    <a href={lecture.video_url} target="_blank" rel="noreferrer">
                      <button className="lecture-btn-external">
                        <ExternalLink size={16} /> Watch External Video
                      </button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Other Lectures Card */}
          <div className="lecture-card lecture-other-lectures-card">
            <div className="lecture-other-header">
              <div className="lecture-other-header-left">
                <div className="lecture-other-icon">
                  <PlaySquare size={20} />
                </div>
                <div>
                  <h3 className="lecture-other-title">Other Lectures</h3>
                  <p className="lecture-other-subtitle">Continue your learning journey with more lectures from this course.</p>
                </div>
              </div>
              <Link to={`/course/${course?.id}`} className="lecture-other-view-all">
                View All Lectures &rarr;
              </Link>
            </div>

            <div className="lecture-other-list">
              {allLectures.length <= 1 ? (
                <div className="lecture-other-empty">no more lectures...</div>
              ) : (
                allLectures.map(l => (
                  <Link 
                    to={`/lecture/${l.id}`} 
                    key={l.id} 
                    className={`lecture-other-card ${l.id === lecture.id ? 'active' : ''}`}
                  >
                    <div className="lecture-other-card-header">
                      <div className="lecture-other-card-icon">
                        {l.id === lecture.id ? <PlayCircle size={16} /> : <Code size={16} />}
                      </div>
                      <span className="lecture-other-card-num">Lecture {l.lecture_order}</span>
                    </div>
                    <h4 className="lecture-other-card-title">{l.title}</h4>
                    <div className="lecture-other-card-status">
                      {progress?.completed && l.id === lecture.id ? (
                        <div className="lecture-status-pill completed">
                          <CheckCircle size={12} /> Completed
                        </div>
                      ) : (
                        <div className="lecture-status-pill not-started">
                          Not Started
                        </div>
                      )}
                      <ChevronRight size={14} className="lecture-status-arrow" />
                    </div>
                    <div className="lecture-other-card-footer">
                      <Clock size={12} /> {l.duration || '12:34'}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
