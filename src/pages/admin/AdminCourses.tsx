import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Globe, Lock, Archive, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassBadge } from '../../components/ui/GlassBadge';
import { courseService } from '../../services/courseService';
import { useAuth } from '../../hooks/useAuth';
import { driveService } from '../../services/googleDrive/driveService';
import { supabase } from '../../services/supabase/client';
import type { Course, CourseCategory, CourseStatus } from '../../types';
import Swal from 'sweetalert2';


export function AdminCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    category_id: '',
    difficulty: 'beginner' as 'beginner'|'intermediate'|'advanced',
    estimated_duration: '',
    external_link: '',
    thumbnail_url: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [coursesData, categoriesData] = await Promise.all([
        courseService.getTeacherCourses(),
        courseService.getCategories()
      ]);
      setCourses(coursesData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setThumbnailFile(null);
    setFormData({
      title: '',
      slug: '',
      short_description: '',
      description: '',
      category_id: categories[0]?.id || '',
      difficulty: 'beginner',
      estimated_duration: '',
      external_link: '',
      thumbnail_url: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setThumbnailFile(null);
    setFormData({
      title: course.title,
      slug: course.slug,
      short_description: course.short_description || '',
      description: course.description || '',
      category_id: course.category_id || categories[0]?.id || '',
      difficulty: course.difficulty,
      estimated_duration: course.estimated_duration || '',
      external_link: course.external_link || '',
      thumbnail_url: course.thumbnail_url || '',
    });
    setIsModalOpen(true);
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug === generateSlug(prev.title) || !prev.slug ? generateSlug(title) : prev.slug
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      let finalThumbnailUrl = formData.thumbnail_url;
      let finalDriveFileId = editingCourse?.drive_file_id || null;

      if (thumbnailFile) {
        const uploadRes = await driveService.uploadFile(thumbnailFile);
        if (uploadRes.success && uploadRes.file) {
          finalDriveFileId = uploadRes.file.id;
          // Store the secure proxy route in the DB instead of a public Drive link
          finalThumbnailUrl = `/api/drive/image/${uploadRes.file.id}`;

          // Delete the old image from Google Drive if replacing an existing one
          if (editingCourse?.drive_file_id) {
            try {
              await fetch(`/api/drive/delete/${editingCourse.drive_file_id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
              });
            } catch (delErr) {
              console.error("Failed to delete old thumbnail:", delErr);
            }
          }
        }
      }

      const coursePayload = {
        ...formData,
        thumbnail_url: finalThumbnailUrl,
        drive_file_id: finalDriveFileId
      };

      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, coursePayload);
      } else {
        await courseService.createCourse({
          ...coursePayload,
          teacher_id: user.id,
          status: 'draft',
        });
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      Swal.fire(`Error saving course: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (courseId: string, status: CourseStatus) => {
    if (!confirm(`Are you sure you want to change this course to ${status}?`)) return;
    try {
      await courseService.updateCourseStatus(courseId, status);
      await fetchData();
    } catch (err: any) {
      Swal.fire(`Error changing status: ${err.message}`);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (error) {
    return <div className="p-4 bg-error/10 text-error rounded-xl border border-error/20">Error loading courses: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Courses</h2>
          <p className="text-muted-foreground">Manage your educational content</p>
        </div>
        <GlassButton variant="primary" className="gap-2" onClick={handleOpenCreateModal}>
          <Plus className="h-4 w-4" /> Add Course
        </GlassButton>
      </div>

      <GlassCard className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="w-full sm:w-96">
            <GlassInput 
              placeholder="Search courses..." 
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <GlassButton variant="secondary" className="gap-2 shrink-0">
            <Filter className="h-4 w-4" /> Filter
          </GlassButton>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">Create your first course to start teaching.</p>
            <GlassButton variant="primary" onClick={handleOpenCreateModal}>Create Course</GlassButton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-glass-highlight text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Course Title</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Difficulty</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {courses.map((course) => {
                  const category = categories.find(c => c.id === course.category_id);
                  return (
                    <tr key={course.id} className="border-b border-glass-highlight/50 hover:bg-glass/30 transition-colors">
                      <td className="py-4 font-medium">
                        <div className="flex items-center gap-3">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} className="w-10 h-10 rounded-md object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <Globe className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <p>{course.title}</p>
                            <p className="text-xs text-muted-foreground font-mono">{course.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-muted-foreground">{category?.name || 'Uncategorized'}</td>
                      <td className="py-4">
                        <GlassBadge variant={course.status === 'published' ? 'success' : course.status === 'archived' ? 'error' : 'warning'}>
                          {course.status}
                        </GlassBadge>
                      </td>
                      <td className="py-4 text-muted-foreground capitalize">{course.difficulty}</td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <Link 
                            to={course.external_link ? course.external_link : (course.slug === 'compiler-construction' ? '/courses/compiler-construction' : `/course/${course.id}`)}
                            target={course.external_link ? "_blank" : "_self"}
                            rel={course.external_link ? "noopener noreferrer" : ""}
                          >
                            <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-accent" title="View Course">
                              <Eye className="h-4 w-4" />
                            </GlassButton>
                          </Link>
                          {course.status !== 'published' && (
                            <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-success" title="Publish" onClick={() => handleStatusChange(course.id, 'published')}>
                              <Globe className="h-4 w-4" />
                            </GlassButton>
                          )}
                          {course.status === 'published' && (
                            <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-warning" title="Move to Draft" onClick={() => handleStatusChange(course.id, 'draft')}>
                              <Lock className="h-4 w-4" />
                            </GlassButton>
                          )}
                          {course.status !== 'archived' && (
                            <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-error" title="Archive" onClick={() => handleStatusChange(course.id, 'archived')}>
                              <Archive className="h-4 w-4" />
                            </GlassButton>
                          )}
                          <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" title="Edit" onClick={() => handleOpenEditModal(course)}>
                            <Edit className="h-4 w-4" />
                          </GlassButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto relative">
            <h3 className="text-2xl font-bold mb-6">{editingCourse ? 'Edit Course' : 'Create New Course'}</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 ml-1">Title</label>
                  <GlassInput required value={formData.title} onChange={handleTitleChange} placeholder="e.g. Advanced Calculus" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1">URL Slug</label>
                  <GlassInput required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="advanced-calculus" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1">Category</label>
                  <select 
                    className="w-full h-10 px-4 rounded-xl border border-glass-highlight bg-glass/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none"
                    value={formData.category_id}
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-background text-foreground">{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1">Difficulty</label>
                  <select 
                    className="w-full h-10 px-4 rounded-xl border border-glass-highlight bg-glass/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none capitalize"
                    value={formData.difficulty}
                    onChange={e => setFormData({...formData, difficulty: e.target.value as any})}
                  >
                    <option value="beginner" className="bg-background text-foreground">Beginner</option>
                    <option value="intermediate" className="bg-background text-foreground">Intermediate</option>
                    <option value="advanced" className="bg-background text-foreground">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1">Estimated Duration</label>
                  <GlassInput value={formData.estimated_duration} onChange={e => setFormData({...formData, estimated_duration: e.target.value})} placeholder="e.g. 10 hours" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 ml-1">External Link (Optional)</label>
                  <GlassInput value={formData.external_link} onChange={e => setFormData({...formData, external_link: e.target.value})} placeholder="https://example.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 ml-1">Website Picture (Optional)</label>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 transition-colors"
                    />
                    {formData.thumbnail_url && !thumbnailFile && (
                      <p className="text-xs text-muted-foreground ml-1">Current image uploaded.</p>
                    )}
                    {thumbnailFile && (
                      <p className="text-xs text-success ml-1">Selected file: {thumbnailFile.name} (Will be uploaded on save)</p>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 ml-1">Short Description</label>
                  <textarea 
                    className="w-full h-20 px-4 py-3 rounded-xl border border-glass-highlight bg-glass/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-colors"
                    value={formData.short_description}
                    onChange={e => setFormData({...formData, short_description: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 ml-1">Full Description</label>
                  <textarea 
                    className="w-full h-32 px-4 py-3 rounded-xl border border-glass-highlight bg-glass/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-colors"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-glass-highlight">
                <GlassButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
                <GlassButton type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Course'}</GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
