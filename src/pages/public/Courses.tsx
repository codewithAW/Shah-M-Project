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
    <div className="space-y-12 py-8">
      {/* Header section */}
      <div className="text-center max-w-3xl mx-auto space-y-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl -z-10"></div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Explore Courses</h1>
        <p className="text-lg text-muted-foreground">Expand your knowledge with our expertly crafted educational content.</p>
      </div>

      {/* Search and Filter */}
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-lg">
          <div className="w-full flex-1">
            <GlassInput 
              type="text" 
              placeholder="Search for courses, subjects, or topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-5 w-5" />}
              className="h-12 text-lg"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              className="h-12 px-4 rounded-xl border border-glass-highlight bg-glass/80 backdrop-blur-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none flex-1 md:w-48"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all" className="bg-background">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-background">{cat.name}</option>
              ))}
            </select>
            <GlassButton variant="secondary" className="h-12 px-6 shrink-0">
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </GlassButton>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="text-center text-error p-8 glass-panel max-w-2xl mx-auto">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-20 text-muted-foreground glass-panel max-w-2xl mx-auto">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-medium text-foreground mb-2">No courses found</h3>
              <p>We couldn't find any courses matching your search criteria.</p>
              <GlassButton 
                variant="ghost" 
                className="mt-6"
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
