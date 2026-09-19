import { Link } from 'react-router-dom';
import { Clock, PlayCircle, CheckCircle } from 'lucide-react';
import type { Course } from '../../types';
import { GlassCard } from './GlassCard';
import { GlassBadge } from './GlassBadge';

interface CourseCardProps {
  course: Course;
  progressPercentage?: number;
}

export function CourseCard({ course, progressPercentage }: CourseCardProps) {
  return (
    <Link to={`/course/${course.id}`} className="course-card-link group">
      <GlassCard className="course-card glass-card">
        {/* Thumbnail */}
        <div className="course-card-thumbnail-wrapper">
          <img 
            src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'} 
            alt={course.title} 
            className="course-card-image"
          />
          <div className="course-card-overlay" />
          <div className="course-card-badges">
            <GlassBadge variant="default" style={{ textTransform: 'capitalize', fontSize: '10px' }}>
              {(course as any).course_categories?.name || 'Uncategorized'}
            </GlassBadge>
          </div>
          
          {/* Progress percentage on thumbnail */}
          {progressPercentage !== undefined && progressPercentage > 0 && (
            <div className="course-card-progress-badge">
              <div className="course-card-progress-circle">
                <span className="course-card-progress-text">{progressPercentage}%</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        {progressPercentage !== undefined && (
          <div className="course-card-progress-bar-bg">
            <div 
              className="course-card-progress-fill" 
              style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              role="progressbar" 
              aria-valuenow={progressPercentage} 
              aria-valuemin={0} 
              aria-valuemax={100}
            />
          </div>
        )}
        
        {/* Content */}
        <div className="course-card-content">
          <h3 className="course-card-title">
            {course.title}
          </h3>
          <p className="course-card-desc">{course.short_description || course.description}</p>
          
          <div className="course-card-footer">
            <div className="course-card-meta">
              <PlayCircle className="h-3.5 w-3.5" />
              <span>Self-paced</span>
            </div>
            <div className="course-card-meta">
              <Clock className="h-3.5 w-3.5" />
              <span>{course.estimated_duration || 'N/A'}</span>
            </div>
            {progressPercentage !== undefined && progressPercentage === 100 && (
              <span className="course-card-done">
                <CheckCircle className="w-3.5 h-3.5"/> Done
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
