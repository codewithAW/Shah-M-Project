import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, PlayCircle, FileUp, Eye, Link as LinkIcon, FileText, Cloud } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassBadge } from '../../components/ui/GlassBadge';
import { courseService } from '../../services/courseService';
import { lectureService } from '../../services/lectureService';
import { ResourceUploader } from '../../components/admin/ResourceUploader';
import { driveService } from '../../services/googleDrive/driveService';
import { supabase } from '../../services/supabase/client';
import type { Course, Lecture } from '../../types';
import Swal from 'sweetalert2';


export function AdminLectures() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [lectures, setLectures] = useState<Lecture[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [managingResourcesFor, setManagingResourcesFor] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    video_type: 'none' as 'youtube'|'google_drive'|'external'|'none',
    video_url: '',
    duration: '',
    thumbnail_url: '',
  });

  const fetchCourses = useCallback(async () => {
    try {
      const data = await courseService.getTeacherCourses();
      setCourses(data);
      if (data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0].id);
      }
    } catch (err: any) {
      Swal.fire(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourse]);

  const fetchLectures = useCallback(async (courseId: string) => {
    setIsLoading(true);
    try {
      const data = await lectureService.getLecturesByCourse(courseId);
      setLectures(data);
    } catch (err: any) {
      Swal.fire(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLectures(selectedCourse);
    }
  }, [selectedCourse, fetchLectures]);

  const handleOpenCreateModal = () => {
    if (!selectedCourse) {
      Swal.fire("Please select a course first.");
      return;
    }
    setEditingLecture(null);
    setThumbnailFile(null);
    setFormData({
      title: '',
      subject: '',
      description: '',
      video_type: 'none',
      video_url: '',
      duration: '',
      thumbnail_url: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setThumbnailFile(null);
    setFormData({
      title: lecture.title,
      subject: lecture.subject || '',
      description: lecture.description || '',
      video_type: lecture.video_type,
      video_url: lecture.video_url || '',
      duration: lecture.duration || '',
      thumbnail_url: lecture.thumbnail_url || '',
    });
    setIsModalOpen(true);
  };

  const handleUrlBlur = async () => {
    if (formData.video_type === 'youtube' && formData.video_url) {
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=${formData.video_url}&format=json`);
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({
            ...prev,
            title: prev.title || data.title,
            thumbnail_url: data.thumbnail_url || prev.thumbnail_url
          }));
        }
      } catch (err) {
        console.error("Failed to fetch YouTube metadata", err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setIsSaving(true);
    try {
      let finalThumbnailUrl = formData.thumbnail_url;
      let finalDriveFileId = editingLecture?.drive_file_id || null;

      if (thumbnailFile) {
        const uploadRes = await driveService.uploadFile(thumbnailFile);
        if (uploadRes.success && uploadRes.file) {
          finalDriveFileId = uploadRes.file.id;
          finalThumbnailUrl = `/api/drive/image/${uploadRes.file.id}`;

          // Delete the old image from Google Drive if replacing an existing one
          if (editingLecture?.drive_file_id) {
            try {
              await fetch(`/api/drive/delete/${editingLecture.drive_file_id}`, {
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

      const lecturePayload = {
        ...formData,
        thumbnail_url: finalThumbnailUrl,
        drive_file_id: finalDriveFileId
      };

      if (editingLecture) {
        await lectureService.updateLecture(editingLecture.id, lecturePayload);
      } else {
        const nextOrder = lectures.length > 0 ? Math.max(...lectures.map(l => l.lecture_order)) + 1 : 1;
        await lectureService.createLecture({
          ...lecturePayload,
          course_id: selectedCourse,
          lecture_order: nextOrder,
          status: 'draft',
        });
      }
      await fetchLectures(selectedCourse);
      setIsModalOpen(false);
    } catch (err: any) {
      Swal.fire(`Error saving lecture: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this lecture?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-danger)',
      cancelButtonColor: 'var(--color-primary)',
      confirmButtonText: 'Yes, delete it!',
      background: 'var(--color-glass-bg)',
      color: 'var(--color-foreground)'
    });
    if (!result.isConfirmed) return;
    try {
      await lectureService.deleteLecture(id);
      await fetchLectures(selectedCourse);
    } catch (err: any) {
      Swal.fire(`Error deleting: ${err.message}`);
    }
  };

  const handleStatusToggle = async (lecture: Lecture) => {
    const newStatus = lecture.status === 'published' ? 'draft' : 'published';
    try {
      await lectureService.updateLectureStatus(lecture.id, newStatus);
      await fetchLectures(selectedCourse);
    } catch(err: any) {
      Swal.fire(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header d-flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h2 className="dashboard-title text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Lectures</h2>
          <p className="font-medium mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Manage your course content</p>
        </div>
        
        <div className="d-flex gap-4 items-center flex-row">
          <select 
            className="form-input admin-header-select"
            style={{ width: '100%', maxWidth: '16rem' }}
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="" disabled style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>Select a course</option>
            {courses.map(c => (
              <option key={c.id} value={c.id} style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>{c.title}</option>
            ))}
          </select>
          <GlassButton className="gap-2 shadow-sm admin-header-btn" onClick={handleOpenCreateModal} disabled={!selectedCourse} style={{ flexShrink: 0 }}>
            <Plus style={{ height: '1.25rem', width: '1.25rem' }} /> Add Lecture
          </GlassButton>
        </div>
      </div>

      <GlassCard className="p-6" style={{ minHeight: '400px' }}>
        {!selectedCourse ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <PlayCircle style={{ height: '3rem', width: '3rem', opacity: 0.5 }} />
            </div>
            <p className="empty-state-desc">Select a course to view and manage its lectures.</p>
          </div>
        ) : isLoading ? (
          <div className="d-flex items-center justify-center p-12">
            <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div>
          </div>
        ) : lectures.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-desc">No lectures added yet. Click 'Add Lecture' to create one.</p>
          </div>
        ) : (
          <div className="d-flex flex-col gap-4">
              {lectures.map((lecture) => (
                <div 
                  key={lecture.id} 
                  className="admin-lecture-row group"
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 className="admin-lecture-row-title">
                    <span className="text-muted text-sm" style={{ fontFamily: 'monospace' }}>{lecture.lecture_order}.</span> 
                    {lecture.thumbnail_url ? (
                      <img src={lecture.thumbnail_url} alt="thumbnail" style={{ width: '3.5rem', height: '2.5rem', objectFit: 'cover', borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
                    ) : (
                      <div className="d-flex items-center justify-center" style={{ width: '3.5rem', height: '2.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}>
                        <span style={{ fontSize: '9px', color: 'var(--color-muted-foreground)', textTransform: 'uppercase', textAlign: 'center', lineHeight: '10px', fontWeight: 'bold' }}>No<br/>Preview</span>
                      </div>
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{lecture.title}</span>
                    {lecture.status === 'published' ? (
                      <GlassBadge variant="success" style={{ fontSize: '10px', textTransform: 'uppercase', flexShrink: 0 }}>Published</GlassBadge>
                    ) : (
                      <GlassBadge variant="warning" style={{ fontSize: '10px', textTransform: 'uppercase', flexShrink: 0 }}>Draft</GlassBadge>
                    )}
                  </h4>
                  <p className="text-sm text-muted font-medium mt-2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lecture.description || 'No description'}</p>
                </div>
                <div className="admin-lecture-row-actions">
                  <GlassButton variant="ghost" size="sm" onClick={() => handleStatusToggle(lecture)}>
                    {lecture.status === 'published' ? 'Unpublish' : 'Publish'}
                  </GlassButton>
                  {lecture.video_url && (
                    <a href={lecture.video_url} target="_blank" rel="noopener noreferrer">
                      <GlassButton variant="ghost" size="sm" className="btn-icon text-foreground" title="View Video">
                        <Eye style={{ height: '1rem', width: '1rem' }} />
                      </GlassButton>
                    </a>
                  )}
                  <GlassButton variant="ghost" size="sm" className="btn-icon text-accent" onClick={() => setManagingResourcesFor(lecture.id)} title="Manage Resources">
                    <FileUp style={{ height: '1rem', width: '1rem' }} />
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="btn-icon text-primary" onClick={() => handleOpenEditModal(lecture)}>
                    <Edit style={{ height: '1rem', width: '1rem' }} />
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="btn-icon text-danger" onClick={() => handleDelete(lecture.id)}>
                    <Trash2 style={{ height: '1rem', width: '1rem' }} />
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <GlassCard className="modal-content">
            <h3 className="modal-title">{editingLecture ? 'Edit Lecture' : 'Create New Lecture'}</h3>
            <form onSubmit={handleSave} className="d-flex flex-col gap-6">
              <div className="d-flex flex-col gap-5">
                <div className="form-group">
                  <label className="form-label">Lecture Title</label>
                  <GlassInput required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Introduction to Derivatives" />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <GlassInput value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="e.g. Mathematics" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-input"
                    style={{ height: '6rem', resize: 'none' }}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                
                {/* Divider for Video Settings */}
                <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <h4 className="font-bold text-sm mb-4" style={{ color: 'var(--color-primary)' }}>Video Settings</h4>
                  <div className="d-flex flex-col gap-5">
                    <div className="form-group">
                      <label className="form-label mb-3 d-block">Video Type</label>
                      <div className="dashboard-grid cols-2" style={{ gap: '0.75rem' }}>
                        
                        <div 
                          onClick={() => setFormData({...formData, video_type: 'none'})}
                          className={`p-3 rounded-xl border cursor-pointer transition-all d-flex items-center gap-3 ${formData.video_type === 'none' ? 'border-primary' : 'border-white/10'}`}
                          style={{ background: formData.video_type === 'none' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)' }}
                        >
                          <div className="d-flex items-center justify-center rounded-lg shadow-sm" style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(255,255,255,0.05)', color: formData.video_type === 'none' ? 'var(--color-primary)' : 'var(--color-muted-foreground)' }}>
                            <FileText style={{ width: '1.25rem', height: '1.25rem' }} />
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ color: formData.video_type === 'none' ? 'var(--color-primary)' : 'var(--color-foreground)' }}>No Video</p>
                            <p className="text-xs text-muted font-medium mt-0.5">Text/Resources</p>
                          </div>
                        </div>

                        <div 
                          onClick={() => setFormData({...formData, video_type: 'youtube'})}
                          className={`p-3 rounded-xl border cursor-pointer transition-all d-flex items-center gap-3 ${formData.video_type === 'youtube' ? 'border-primary' : 'border-white/10'}`}
                          style={{ background: formData.video_type === 'youtube' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)' }}
                        >
                          <div className="d-flex items-center justify-center rounded-lg shadow-sm" style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(255,255,255,0.05)', color: formData.video_type === 'youtube' ? '#ef4444' : 'var(--color-muted-foreground)' }}>
                            <PlayCircle style={{ width: '1.25rem', height: '1.25rem' }} />
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ color: formData.video_type === 'youtube' ? '#ef4444' : 'var(--color-foreground)' }}>YouTube</p>
                            <p className="text-xs text-muted font-medium mt-0.5">Public Video</p>
                          </div>
                        </div>

                        <div 
                          onClick={() => setFormData({...formData, video_type: 'external'})}
                          className={`p-3 rounded-xl border cursor-pointer transition-all d-flex items-center gap-3 ${formData.video_type === 'external' ? 'border-primary' : 'border-white/10'}`}
                          style={{ background: formData.video_type === 'external' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)' }}
                        >
                          <div className="d-flex items-center justify-center rounded-lg shadow-sm" style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(255,255,255,0.05)', color: formData.video_type === 'external' ? 'var(--color-primary)' : 'var(--color-muted-foreground)' }}>
                            <LinkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ color: formData.video_type === 'external' ? 'var(--color-primary)' : 'var(--color-foreground)' }}>External URL</p>
                            <p className="text-xs text-muted font-medium mt-0.5">Direct Link</p>
                          </div>
                        </div>

                        <div 
                          onClick={() => setFormData({...formData, video_type: 'google_drive'})}
                          className={`p-3 rounded-xl border cursor-pointer transition-all d-flex items-center gap-3 ${formData.video_type === 'google_drive' ? 'border-primary' : 'border-white/10'}`}
                          style={{ background: formData.video_type === 'google_drive' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)' }}
                        >
                          <div className="d-flex items-center justify-center rounded-lg shadow-sm" style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(255,255,255,0.05)', color: formData.video_type === 'google_drive' ? '#10b981' : 'var(--color-muted-foreground)' }}>
                            <Cloud style={{ width: '1.25rem', height: '1.25rem' }} />
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ color: formData.video_type === 'google_drive' ? '#10b981' : 'var(--color-foreground)' }}>Google Drive</p>
                            <p className="text-xs text-muted font-medium mt-0.5">Phase 4</p>
                          </div>
                        </div>

                      </div>
                    </div>
                    
                    {formData.video_type !== 'none' && (
                      <div className="form-group">
                        <label className="form-label">Video URL {formData.video_type === 'youtube' && <span className="font-medium text-primary text-xs" style={{ textTransform: 'lowercase' }}>(Thumbnail & Title will auto-load)</span>}</label>
                        <GlassInput 
                          value={formData.video_url} 
                          onChange={e => setFormData({...formData, video_url: e.target.value})} 
                          onBlur={handleUrlBlur}
                          placeholder="https://..." 
                        />
                        {formData.thumbnail_url && !thumbnailFile && (
                          <div style={{ marginTop: 'var(--space-4)', width: '10rem', height: '6rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                            <img src={formData.thumbnail_url} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label className="form-label">Duration</label>
                      <GlassInput value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="e.g. 15:30" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Custom Thumbnail <span style={{ textTransform: 'lowercase', color: 'var(--color-muted-foreground)' }}>(Optional)</span>
                      </label>
                      <div className="p-5 rounded-xl border border-dashed text-center transition-all" style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.02)' }}>
                        <input 
                          type="file" 
                          id="thumbnail-upload"
                          accept="image/*"
                          onChange={e => e.target.files && setThumbnailFile(e.target.files[0])}
                          style={{ display: 'none' }}
                        />
                        <label 
                          htmlFor="thumbnail-upload" 
                          className="cursor-pointer shadow-sm transition-all" 
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1.25rem', 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: 'var(--color-primary)', 
                            borderRadius: '9999px', 
                            fontSize: 'var(--font-size-sm)', 
                            fontWeight: 'bold' 
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                          }}
                        >
                          <FileUp style={{ width: '1.25rem', height: '1.25rem' }} /> Choose Image File
                        </label>
                        {thumbnailFile && (
                          <p className="text-xs text-success mt-3 font-bold d-flex items-center justify-center gap-1 tracking-tight">
                            Selected: {thumbnailFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <GlassButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
                <GlassButton type="submit" variant="primary" disabled={isSaving} className="shadow-sm">{isSaving ? 'Saving...' : 'Save Lecture'}</GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {managingResourcesFor && (
        <ResourceUploader 
          courseId={selectedCourse} 
          lectureId={managingResourcesFor} 
          onClose={() => setManagingResourcesFor(null)} 
        />
      )}
    </div>
  );
}
