import { useState, useRef, useEffect } from 'react';
import { UploadCloud, File, Trash2, ExternalLink, X, FileText, Image, Film } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassBadge } from '../ui/GlassBadge';
import { resourceService } from '../../services/resourceService';
import type { Resource, ResourceType } from '../../types';

interface ResourceUploaderProps {
  courseId: string;
  lectureId: string;
  onClose: () => void;
}

export function ResourceUploader({ courseId, lectureId, onClose }: ResourceUploaderProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResources();
  }, [lectureId]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const data = await resourceService.getResourcesByLecture(lectureId);
      setResources(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getResourceType = (mimeType: string): ResourceType => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    return 'other';
  };

  const getResourceIcon = (type: ResourceType) => {
    switch(type) {
      case 'pdf': return <FileText className="text-error h-5 w-5" />;
      case 'image': return <Image className="text-success h-5 w-5" />;
      case 'video': return <Film className="text-primary h-5 w-5" />;
      default: return <File className="text-muted-foreground h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    setUploadProgress(10); // Fake initial progress

    try {
      // 1. Upload to backend/Drive
      const driveRes = await resourceService.uploadResourceFile(file);
      setUploadProgress(60);

      // 2. Save metadata to Supabase
      await resourceService.createResource({
        course_id: courseId,
        lecture_id: lectureId,
        title: file.name,
        resource_type: getResourceType(file.type),
        file_name: file.name,
        storage_provider: 'google_drive',
        mime_type: file.type,
        file_size: file.size,
        drive_file_id: driveRes.file.id,
        web_view_url: driveRes.file.webViewLink,
        thumbnail_url: driveRes.file.thumbnailLink
      });

      setUploadProgress(100);
      await fetchResources();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDelete = async (resource: Resource) => {
    if (!confirm(`Are you sure you want to delete ${resource.title}?`)) return;
    
    try {
      await resourceService.deleteResourceWithFile(resource);
      await fetchResources();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-glass-highlight flex justify-between items-center bg-glass-highlight/30">
          <div>
            <h3 className="text-xl font-bold">Lecture Resources</h3>
            <p className="text-sm text-muted-foreground">Upload and manage files for this lecture</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-glass transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          {/* Upload Area */}
          <div className="border-2 border-dashed border-glass-highlight rounded-2xl p-8 text-center bg-glass/20 hover:bg-glass/40 transition-colors relative group">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              disabled={isUploading}
            />
            <div className="pointer-events-none flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Click or drag files to upload</p>
                <p className="text-xs text-muted-foreground mt-1">Supports PDF, Word, MP4, JPEG, PNG (Max 100MB)</p>
              </div>
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur flex flex-col items-center justify-center p-8 rounded-2xl z-10">
                <p className="font-medium mb-3">Uploading to Google Drive...</p>
                <div className="w-full max-w-xs h-2 bg-glass-highlight rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Resource List */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center justify-between">
              Attached Files
              <GlassBadge variant="default">{resources.length}</GlassBadge>
            </h4>
            
            {isLoading ? (
              <div className="flex justify-center p-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div></div>
            ) : resources.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border border-glass-highlight rounded-xl bg-glass/10">
                No resources uploaded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {resources.map((res) => (
                  <div key={res.id} className="flex items-center gap-4 p-4 rounded-xl border border-glass-highlight bg-glass/30 hover:bg-glass/50 transition-colors">
                    {res.thumbnail_url ? (
                      <img src={res.thumbnail_url} alt="thumbnail" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-background flex items-center justify-center border border-glass-highlight">
                        {getResourceIcon(res.resource_type)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{res.title}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span className="uppercase">{res.resource_type}</span>
                        {res.file_size && <span>• {formatFileSize(res.file_size)}</span>}
                        <span>• {new Date(res.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      {res.web_view_url && (
                        <a href={res.web_view_url} target="_blank" rel="noreferrer">
                          <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary">
                            <ExternalLink className="h-4 w-4" />
                          </GlassButton>
                        </a>
                      )}
                      <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-error hover:bg-error/10" onClick={() => handleDelete(res)}>
                        <Trash2 className="h-4 w-4" />
                      </GlassButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
