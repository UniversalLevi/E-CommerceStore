'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';
import {
  Video,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileVideo,
  HardDrive,
  Zap,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';

interface VideoJob {
  id: string;
  originalFileName: string;
  originalFileSize: number;
  mutatedFileName?: string;
  mutatedFileSize?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  processingDuration?: number;
  mutationParams?: {
    speedFactor: number;
    cropWidth: number;
    cropHeight: number;
    brightness: number;
    contrast: number;
  };
  createdAt: string;
  completedAt?: string;
}

interface Stats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  processingJobs: number;
  totalOriginalSize: number;
  totalMutatedSize: number;
  avgProcessingTime: number;
}

export default function VideoMutatorPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [jobsResponse, statsResponse] = await Promise.all([
        api.getVideoMutatorJobs({ page: pagination.page, limit: pagination.limit }),
        api.getVideoMutatorStats(),
      ]);
      setJobs(jobsResponse.data.jobs);
      setPagination(jobsResponse.data.pagination);
      setStats(statsResponse.data);
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Poll for updates on pending/processing jobs
  useEffect(() => {
    const hasPendingJobs = jobs.some(
      (job) => job.status === 'pending' || job.status === 'processing'
    );

    if (hasPendingJobs) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [jobs, fetchData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      notify.error('Invalid file type. Only MP4, MOV, AVI, and WebM videos are allowed.');
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      notify.error('File too large. Maximum size is 100MB.');
      return;
    }

    try {
      setUploading(true);
      const response = await api.uploadVideoForMutation(file);
      notify.success(response.message);
      fetchData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to upload video');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDownload = async (job: VideoJob) => {
    if (job.status !== 'completed') return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      window.open(`${baseUrl}/api/video-mutator/jobs/${job.id}/download`, '_blank');
    } catch (error: any) {
      notify.error('Failed to download video');
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await api.retryVideoMutatorJob(jobId);
      notify.success('Job queued for retry');
      fetchData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to retry job');
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job and its files?')) return;

    try {
      await api.deleteVideoMutatorJob(jobId);
      notify.success('Job deleted successfully');
      fetchData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to delete job');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getDaysRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysLeft <= 0) return { days: 0, color: 'text-red-400' };
    if (daysLeft === 1) return { days: 1, color: 'text-amber-400' };
    return { days: daysLeft, color: 'text-emerald-400' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Video Mutator
            </span>
          </h1>
          <p className="mt-2 text-text-secondary">
            Make your videos unique for social media platforms
          </p>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <span
            className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-lg hover:shadow-xl ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Video
              </>
            )}
          </span>
        </label>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-400 font-medium">Important Notice</p>
          <p className="text-amber-400/80 text-sm mt-1">
            Videos are automatically deleted after <strong>3 days</strong> to save server space. 
            Please download your mutated videos before they expire. Maximum upload size is <strong>100MB</strong>.
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileVideo className="w-5 h-5 text-violet-400" />
              <p className="text-text-muted text-sm">Total Jobs</p>
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats.totalJobs}</p>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <p className="text-text-muted text-sm">Completed</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.completedJobs}</p>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-5 h-5 text-cyan-400" />
              <p className="text-text-muted text-sm">Total Storage</p>
            </div>
            <p className="text-2xl font-bold text-cyan-400">
              {formatFileSize(stats.totalOriginalSize + stats.totalMutatedSize)}
            </p>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <p className="text-text-muted text-sm">Avg. Processing</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              {formatDuration(Math.round(stats.avgProcessingTime || 0))}
            </p>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-surface-raised border border-border-default rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-400" />
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-surface-elevated rounded-lg">
            <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-violet-400 font-bold">1</span>
            </div>
            <h3 className="font-medium text-text-primary mb-1">Upload</h3>
            <p className="text-text-muted text-sm">Upload your video (MP4, MOV, WebM) - Max 100MB</p>
          </div>
          <div className="p-4 bg-surface-elevated rounded-lg">
            <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-violet-400 font-bold">2</span>
            </div>
            <h3 className="font-medium text-text-primary mb-1">Process</h3>
            <p className="text-text-muted text-sm">We apply random mutations automatically</p>
          </div>
          <div className="p-4 bg-surface-elevated rounded-lg">
            <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-violet-400 font-bold">3</span>
            </div>
            <h3 className="font-medium text-text-primary mb-1">Mutations</h3>
            <p className="text-text-muted text-sm">Speed, crop, brightness, contrast, 2K resize</p>
          </div>
          <div className="p-4 bg-surface-elevated rounded-lg">
            <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-violet-400 font-bold">4</span>
            </div>
            <h3 className="font-medium text-text-primary mb-1">Download</h3>
            <p className="text-text-muted text-sm">Download within 3 days before auto-deletion</p>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border-default flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Video className="w-5 h-5 text-violet-400" />
            Your Videos
          </h2>
          <button
            onClick={fetchData}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <FileVideo className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No videos yet</p>
            <p className="text-text-muted text-sm mt-2">
              Upload a video to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-surface-elevated">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                          <FileVideo className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary truncate max-w-[200px]">
                            {job.originalFileName}
                          </p>
                          {job.mutatedFileName && (
                            <p className="text-xs text-text-muted truncate max-w-[200px]">
                              → {job.mutatedFileName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(job.status)}
                      {job.error && (
                        <p className="text-xs text-red-400 mt-1 max-w-[150px] truncate">
                          {job.error}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      <div>
                        <p>{formatFileSize(job.originalFileSize)}</p>
                        {job.mutatedFileSize && (
                          <p className="text-xs text-text-muted">
                            → {formatFileSize(job.mutatedFileSize)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {formatDuration(job.processingDuration)}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      <div>
                        <p>{new Date(job.createdAt).toLocaleDateString()}</p>
                        {(() => {
                          const remaining = getDaysRemaining(job.createdAt);
                          return (
                            <p className={`text-xs ${remaining.color}`}>
                              {remaining.days > 0 ? `${remaining.days}d left` : 'Expiring soon'}
                            </p>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {job.status === 'completed' && (
                          <button
                            onClick={() => handleDownload(job)}
                            className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                            title="Retry"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center p-6 border-t border-border-default">
            <p className="text-text-secondary text-sm">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} jobs
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

