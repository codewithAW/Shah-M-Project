import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, PlayCircle, FileUp, Eye } from 'lucide-react';
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
    if (!confirm('Are you sure you want to delete this lecture?')) return;
    try {
      await lectureService.deleteLecture(id);
      await fetchLectures(selectedCourse);
    } catch (err: any) {
      Swal.fire(`Error deleting: ${err.message}`);
    }
  };

  const moveLecture = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === lectures.length - 1)
    ) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newLectures = [...lectures];
    
    // Swap order values
    const tempOrder = newLectures[index].lecture_order;
    newLectures[index].lecture_order = newLectures[newIndex].lecture_order;
    newLectures[newIndex].lecture_order = tempOrder;
    
    // Sort array for UI immediately
    newLectures.sort((a, b) => a.lecture_order - b.lecture_order);
    setLectures(newLectures);
    
    // Persist to DB
    try {
      await lectureService.updateLectureOrders([
        { id: newLectures[index].id, lecture_order: newLectures[index].lecture_order },
        { id: newLectures[newIndex].id, lecture_order: newLectures[newIndex].lecture_order }
      ]);
    } catch (err) {
      Swal.fire("Error saving new order. Refreshing data.");
      fetchLectures(selectedCourse);
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

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lectures</h2>
          <p className="text-muted-foreground">Manage your course content</p>
        </div>
        
        <div className="w-full sm:w-auto flex gap-4 items-center">
          <select 
            className="w-full sm:w-64 h-10 px-4 rounded-xl border border-glass-highlight bg-glass/80 backdrop-blur-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="" disabled className="bg-background text-foreground">Select a course</option>
            {courses.map(c => (
              <option key={c.id} value={c.id} className="bg-background text-foreground">{c.title}</option>
            ))}
          </select>
          <GlassButton variant="primary" className="gap-2 shrink-0" onClick={handleOpenCreateModal} disabled={!selectedCourse}>
            <Plus className="h-4 w-4" /> Add Lecture
          </GlassButton>
        </div>
      </div>

      <GlassCard className="p-4 sm:p-6 min-h-[400px]">
        {!selectedCourse ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
            <PlayCircle className="h-12 w-12 mb-4 opacity-20" />
            <p>Select a course to view and manage its lectures.</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
        ) : lectures.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p>No lectures added yet. Click 'Add Lecture' to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lectures.map((lecture, idx) => (
              <div key={lecture.id} className="flex items-center gap-4 p-4 rounded-xl border border-glass-highlight bg-glass/30 hover:bg-glass/50 transition-colors group">
                <div className="flex flex-col gap-1 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors">
                  <button onClick={() => moveLecture(idx, 'up')} disabled={idx === 0} className="hover:text-primary disabled:opacity-0">▲</button>
                  <button onClick={() => moveLecture(idx, 'down')} disabled={idx === lectures.length - 1} className="hover:text-primary disabled:opacity-0">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground flex items-center gap-3">
                    <span className="text-muted-foreground w-6 font-mono text-sm">{lecture.lecture_order}.</span> 
                    {lecture.thumbnail_url ? (
                      <img src={lecture.thumbnail_url} alt="thumbnail" className="w-12 h-8 object-cover rounded shadow-sm shrink-0" />
                    ) : (
                      <div className="w-12 h-8 bg-glass/20 rounded shadow-sm shrink-0 flex items-center justify-center border border-glass-highlight overflow-hidden">
                        <span className="text-[8px] text-muted-foreground/60 uppercase text-center leading-[10px] font-medium tracking-tighter">No<br/>Preview</span>
                      </div>
                    )}
                    {lecture.title}
                    {lecture.status === 'published' ? (
                      <GlassBadge variant="success" className="text-[10px] px-2 py-0">Published</GlassBadge>
                    ) : (
                      <GlassBadge variant="warning" className="text-[10px] px-2 py-0">Draft</GlassBadge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate ml-9">{lecture.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <GlassButton variant="ghost" size="sm" onClick={() => handleStatusToggle(lecture)}>
                    {lecture.status === 'published' ? 'Unpublish' : 'Publish'}
                  </GlassButton>
                  {lecture.video_url && (
                    <a href={lecture.video_url} target="_blank" rel="noopener noreferrer">
                      <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-foreground" title="View Video">
                        <Eye className="h-4 w-4" />
                      </GlassButton>
                    </a>
                  )}
                  <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-accent" onClick={() => setManagingResourcesFor(lecture.id)} title="Manage Resources">
                    <FileUp className="h-4 w-4" />
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" onClick={() => handleOpenEditModal(lecture)}>
                    <Edit className="h-4 w-4" />
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-error hover:bg-error/10" onClick={() => handleDelete(lecture.id)}>
                    <Trash2 className="h-4 w-4" />
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto relative">
            <h3 className="text-2xl font-bold mb-6">{editingLecture ? 'Edit Lecture' : 'Create New Lecture'}</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 ml-1">Lecture Title</label>
                  <GlassInput required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Introduction to Derivatives" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 ml-1">Description</label>
                  <textarea 
                    className="w-full h-24 px-4 py-3 rounded-xl border border-glass-highlight bg-glass/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-colors"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1">Video Type</label>
                  <select 
                    className="w-full h-10 px-4 rounded-xl border border-glass-highlight bg-glass/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none"
                    value={formData.video_type}
                    onChange={e => setFormData({...formData, video_type: e.target.value as any})}
                  >
                    <option value="none" className="bg-background text-foreground">No Video (Text/Resources only)</option>
                    <option value="youtube" className="bg-background text-foreground">YouTube</option>
                    <option value="external" className="bg-background text-foreground">External URL</option>
                    <option value="google_drive" className="bg-background text-foreground">Google Drive (Phase 4)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1">Duration</label>
                  <GlassInput value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="e.g. 15:30" />
                </div>
                {formData.video_type !== 'none' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5 ml-1">Video URL {formData.video_type === 'youtube' && <span className="text-xs text-muted-foreground font-normal">(Thumbnail & Title will auto-load)</span>}</label>
                    <GlassInput 
                      value={formData.video_url} 
                      onChange={e => setFormData({...formData, video_url: e.target.value})} 
                      onBlur={handleUrlBlur}
                      placeholder="https://..." 
                    />
                    {formData.thumbnail_url && !thumbnailFile && (
                      <div className="mt-3 relative w-32 h-20 rounded-lg overflow-hidden border border-glass-highlight">
                        <img src={formData.thumbnail_url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 ml-1">
                    Custom Thumbnail <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => e.target.files && setThumbnailFile(e.target.files[0])}
                      className="w-full h-10 px-3 py-2 rounded-xl border border-glass-highlight bg-glass/50 text-sm text-foreground file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-colors"
                    />
                    {thumbnailFile && (
                      <p className="text-xs text-success mt-2 font-medium flex items-center gap-1">
                        Selected: {thumbnailFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-glass-highlight">
                <GlassButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
                <GlassButton type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Lecture'}</GlassButton>
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
