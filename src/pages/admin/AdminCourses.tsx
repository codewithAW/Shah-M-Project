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
import { API_BASE } from '../../config';


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
          finalThumbnailUrl = `${API_BASE}/api/drive/image/${uploadRes.file.id}`;

          // Delete the old image from Google Drive if replacing an existing one
          if (editingCourse?.drive_file_id) {
            try {
              await fetch(`${API_BASE}/api/drive/delete/${editingCourse.drive_file_id}`, {
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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to change this course to ${status}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-primary)',
      cancelButtonColor: 'var(--color-danger)',
      confirmButtonText: 'Yes, change it!',
      background: 'var(--color-glass-bg)',
      color: 'var(--color-foreground)'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await courseService.updateCourseStatus(courseId, status);
      await fetchData();
    } catch (err: any) {
      Swal.fire(`Error changing status: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex items-center justify-center" style={{ height: '16rem' }}>
        <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Error loading courses: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header d-flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h2 className="dashboard-title text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Courses</h2>
          <p className="font-medium mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Manage your educational content</p>
        </div>
        <GlassButton className="gap-2 shadow-sm admin-header-btn" onClick={handleOpenCreateModal}>
          <Plus style={{ height: '1.25rem', width: '1.25rem' }} /> Add Course
        </GlassButton>
      </div>

      <GlassCard className="p-6">
        <div className="d-flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div style={{ width: '100%', maxWidth: '24rem' }}>
            <GlassInput 
              placeholder="Search courses..." 
              icon={<Search style={{ height: '1rem', width: '1rem' }} />}
            />
          </div>
          <GlassButton variant="secondary" className="gap-2" style={{ flexShrink: 0 }}>
            <Filter style={{ height: '1rem', width: '1rem' }} /> Filter
          </GlassButton>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Plus style={{ height: '2.5rem', width: '2.5rem' }} />
            </div>
            <h3 className="empty-state-title">No courses yet</h3>
            <p className="empty-state-desc">Create your first course to start teaching.</p>
            <GlassButton variant="primary" className="shadow-sm px-8" onClick={handleOpenCreateModal}>Create Course</GlassButton>
          </div>
        ) : (
          <div className="table-container">
            <table className="table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Difficulty</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const category = categories.find(c => c.id === course.category_id);
                  return (
                    <tr key={course.id}>
                      <td>
                        <div className="d-flex items-center gap-3">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div className="d-flex items-center justify-center text-primary" style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.1)', flexShrink: 0 }}>
                              <Globe style={{ height: '1.25rem', width: '1.25rem' }} />
                            </div>
                          )}
                          <div>
                            <p style={{ fontWeight: 'var(--font-weight-medium)' }}>{course.title}</p>
                            <p className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>{course.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted">{category?.name || 'Uncategorized'}</td>
                      <td>
                        <GlassBadge variant={course.status === 'published' ? 'success' : course.status === 'archived' ? 'danger' : 'warning'} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {course.status}
                        </GlassBadge>
                      </td>
                      <td className="text-muted" style={{ textTransform: 'capitalize' }}>{course.difficulty}</td>
                      <td className="text-right">
                        <div className="d-flex justify-end gap-2 items-center">
                          <Link 
                            to={course.external_link ? course.external_link : (course.slug === 'compiler-construction' ? '/courses/compiler-construction' : `/course/${course.id}`)}
                            target={course.external_link ? "_blank" : "_self"}
                            rel={course.external_link ? "noopener noreferrer" : ""}
                          >
                            <GlassButton variant="ghost" size="sm" className="btn-icon text-primary" title="View Course">
                              <Eye style={{ height: '1rem', width: '1rem' }} />
                            </GlassButton>
                          </Link>
                          {course.status !== 'published' && (
                            <GlassButton variant="ghost" size="sm" className="btn-icon text-success" title="Publish" onClick={() => handleStatusChange(course.id, 'published')}>
                              <Globe style={{ height: '1rem', width: '1rem' }} />
                            </GlassButton>
                          )}
                          {course.status === 'published' && (
                            <GlassButton variant="ghost" size="sm" className="btn-icon text-warning" title="Move to Draft" onClick={() => handleStatusChange(course.id, 'draft')}>
                              <Lock style={{ height: '1rem', width: '1rem' }} />
                            </GlassButton>
                          )}
                          {course.status !== 'archived' && (
                            <GlassButton variant="ghost" size="sm" className="btn-icon text-danger" title="Archive" onClick={() => handleStatusChange(course.id, 'archived')}>
                              <Archive style={{ height: '1rem', width: '1rem' }} />
                            </GlassButton>
                          )}
                          <GlassButton variant="ghost" size="sm" className="btn-icon text-primary" title="Edit" onClick={() => handleOpenEditModal(course)}>
                            <Edit style={{ height: '1rem', width: '1rem' }} />
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
        <div className="modal-overlay">
          <GlassCard className="modal-content">
            <h3 className="modal-title">{editingCourse ? 'Edit Course' : 'Create New Course'}</h3>
            <form onSubmit={handleSave} className="d-flex flex-col gap-6">
              <div className="dashboard-grid cols-2">
                <div className="form-group sm-col-span-2">
                  <label className="form-label">Title</label>
                  <GlassInput required value={formData.title} onChange={handleTitleChange} placeholder="e.g. Advanced Calculus" />
                </div>
                <div className="form-group">
                  <label className="form-label">URL Slug</label>
                  <GlassInput required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="advanced-calculus" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-input"
                    value={formData.category_id}
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select 
                    className="form-input"
                    style={{ textTransform: 'capitalize' }}
                    value={formData.difficulty}
                    onChange={e => setFormData({...formData, difficulty: e.target.value as any})}
                  >
                    <option value="beginner" style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>Beginner</option>
                    <option value="intermediate" style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>Intermediate</option>
                    <option value="advanced" style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Duration</label>
                  <GlassInput value={formData.estimated_duration} onChange={e => setFormData({...formData, estimated_duration: e.target.value})} placeholder="e.g. 10 hours" />
                </div>
                <div className="form-group sm-col-span-2">
                  <label className="form-label">External Link (Optional)</label>
                  <GlassInput value={formData.external_link} onChange={e => setFormData({...formData, external_link: e.target.value})} placeholder="https://example.com" />
                </div>
                <div className="form-group sm-col-span-2">
                  <label className="form-label">Website Picture (Optional)</label>
                  <div className="d-flex flex-col gap-3">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                      style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-foreground)' }}
                    />
                    {formData.thumbnail_url && !thumbnailFile && (
                      <p className="text-xs text-muted" style={{ fontWeight: 'var(--font-weight-medium)' }}>Current image uploaded.</p>
                    )}
                    {thumbnailFile && (
                      <p className="text-xs text-success" style={{ fontWeight: 'var(--font-weight-medium)' }}>Selected file: {thumbnailFile.name} (Will be uploaded on save)</p>
                    )}
                  </div>
                </div>
                <div className="form-group sm-col-span-2">
                  <label className="form-label">Short Description</label>
                  <textarea 
                    className="form-input"
                    style={{ height: '6rem', resize: 'none' }}
                    value={formData.short_description}
                    onChange={e => setFormData({...formData, short_description: e.target.value})}
                  />
                </div>
                <div className="form-group sm-col-span-2">
                  <label className="form-label">Full Description</label>
                  <textarea 
                    className="form-input"
                    style={{ height: '10rem', resize: 'none' }}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <GlassButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
                <GlassButton type="submit" variant="primary" disabled={isSaving} className="shadow-sm">{isSaving ? 'Saving...' : 'Save Course'}</GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
