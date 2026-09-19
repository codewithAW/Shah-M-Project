import { useState, useEffect } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { CourseCard } from '../../components/ui/CourseCard';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassButton } from '../../components/ui/GlassButton';
import { courseService } from '../../services/courseService';
import type { Course, CourseCategory } from '../../types';

export function Courses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [coursesData, categoriesData] = await Promise.all([
          courseService.getPublishedCourses(),
          courseService.getCategories()
        ]);
        setCourses(coursesData);
        setCategories(categoriesData);
      } catch (err: any) {
        setError(err.message || 'Failed to load courses.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (course.short_description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container" style={{ paddingTop: '5rem', paddingBottom: 'var(--space-12)' }}>
      {/* Header section */}
      <div style={{ textAlign: 'center', maxWidth: '48rem', margin: '0 auto var(--space-12)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', background: 'rgba(99, 102, 241, 0.15)', borderRadius: 'var(--radius-full)', filter: 'blur(80px)', zIndex: -1, pointerEvents: 'none' }} />
        <h1 className="text-h1" style={{ marginBottom: 'var(--space-4)' }}>Explore Courses</h1>
        <p className="text-muted" style={{ fontSize: 'var(--font-size-lg)', lineHeight: 1.6 }}>Expand your knowledge with our expertly crafted educational content.</p>
      </div>

      {/* Search and Filter */}
      <div style={{ maxWidth: '56rem', margin: '0 auto var(--space-12)' }}>
        <div className="glass-card" style={{ padding: 'var(--space-4)', borderRadius: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <GlassInput 
              type="text" 
              placeholder="Search for courses, subjects, or topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search style={{ height: '1.25rem', width: '1.25rem' }} />}
              style={{ height: '3rem', fontSize: 'var(--font-size-base)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%', flex: '1 1 300px' }}>
            <select 
              className="form-input"
              style={{ height: '3rem', flex: 1 }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <GlassButton variant="secondary" style={{ height: '3rem', padding: '0 var(--space-6)', flexShrink: 0 }}>
              <Filter style={{ height: '1rem', width: '1rem', marginRight: 'var(--space-2)' }} />
              Filter
            </GlassButton>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="glass-card text-center text-danger" style={{ maxWidth: '42rem', margin: '0 auto', padding: 'var(--space-8)' }}>{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-8">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="glass-card text-center text-muted" style={{ maxWidth: '42rem', margin: '0 auto', padding: '5rem 0' }}>
              <BookOpen style={{ height: '4rem', width: '4rem', margin: '0 auto var(--space-4)', opacity: 0.2 }} />
              <h3 className="text-h4" style={{ marginBottom: 'var(--space-2)' }}>No courses found</h3>
              <p>We couldn't find any courses matching your search criteria.</p>
              <GlassButton 
                variant="ghost" 
                style={{ marginTop: 'var(--space-6)' }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </GlassButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
