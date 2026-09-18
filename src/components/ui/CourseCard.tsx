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
    <Link to={`/course/${course.id}`} className="group block h-full">
      <GlassCard className="flex h-full flex-col p-0 overflow-hidden hover:shadow-glass-lg transition-all duration-200">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'} 
            alt={course.title} 
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <GlassBadge variant="default" className="capitalize text-[10px] bg-white/90 text-foreground backdrop-blur-sm">
              {(course as any).course_categories?.name || 'Uncategorized'}
            </GlassBadge>
          </div>
          
          {/* Progress percentage on thumbnail */}
          {progressPercentage !== undefined && progressPercentage > 0 && (
            <div className="absolute top-3 right-3">
              <div className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{progressPercentage}%</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        {progressPercentage !== undefined && (
          <div className="h-1 w-full bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              role="progressbar" 
              aria-valuenow={progressPercentage} 
              aria-valuemin={0} 
              aria-valuemax={100}
            />
          </div>
        )}
        
        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-1.5">
            {course.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.short_description || course.description}</p>
          
          <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <PlayCircle className="h-3.5 w-3.5" />
              <span>Self-paced</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{course.estimated_duration || 'N/A'}</span>
            </div>
            {progressPercentage !== undefined && progressPercentage === 100 && (
              <span className="text-success flex items-center gap-1 font-medium">
                <CheckCircle className="w-3.5 h-3.5"/> Done
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
