'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';
import {
  Video,
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
  Users,
  Filter,
  AlertTriangle,
} from 'lucide-react';

interface VideoJob {
  id: string;
  user: {
    _id: string;
    email?: string;
    name?: string;
    mobile?: string;
  };
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
  uniqueUsers: number;
  recentJobs: any[];
}

export default function AdminVideoMutatorPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [jobsResponse, statsResponse] = await Promise.all([
        api.adminGetVideoMutatorJobs({
          page: pagination.page,
          limit: pagination.limit,
          status: statusFilter || undefined,
        }),
        api.adminGetVideoMutatorStats(),
      ]);
      setJobs(jobsResponse.data.jobs);
      setPagination(jobsResponse.data.pagination);
      setStats(statsResponse.data);
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchData();
    }
  }, [isAuthenticated, user, fetchData]);

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

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job and its files?')) return;

    try {
      await api.adminDeleteVideoMutatorJob(jobId);
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
              Video Mutator Admin
            </span>
          </h1>
          <p className="mt-2 text-text-secondary">
            Manage all user video mutation jobs
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-text-secondary hover:text-text-primary bg-surface-elevated border border-border-default rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 font-medium">Auto-Cleanup Active</p>
          <p className="text-blue-400/80 text-sm mt-1">
            Videos are automatically deleted after <strong>3 days</strong> to save server space. 
            Cleanup runs daily at 2:00 AM. Max upload size: <strong>100MB</strong>.
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileVideo className="w-5 h-5 text-violet-400" />
              <p className="text-text-muted text-sm">Total Jobs</p>
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats.totalJobs}</p>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <p className="text-text-muted text-sm">Unique Users</p>
            </div>
            <p className="text-2xl font-bold text-cyan-400">{stats.uniqueUsers}</p>
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
              <HardDrive className="w-5 h-5 text-blue-400" />
              <p className="text-text-muted text-sm">Total Storage</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">
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

      {/* Status breakdown */}
      {stats && (
        <div className="bg-surface-raised border border-border-default rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Status Breakdown</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-surface-elevated rounded-lg">
              <p className="text-text-muted text-sm mb-1">Pending</p>
              <p className="text-xl font-bold text-yellow-400">{stats.pendingJobs}</p>
            </div>
            <div className="p-4 bg-surface-elevated rounded-lg">
              <p className="text-text-muted text-sm mb-1">Processing</p>
              <p className="text-xl font-bold text-blue-400">{stats.processingJobs}</p>
            </div>
            <div className="p-4 bg-surface-elevated rounded-lg">
              <p className="text-text-muted text-sm mb-1">Completed</p>
              <p className="text-xl font-bold text-emerald-400">{stats.completedJobs}</p>
            </div>
            <div className="p-4 bg-surface-elevated rounded-lg">
              <p className="text-text-muted text-sm mb-1">Failed</p>
              <p className="text-xl font-bold text-red-400">{stats.failedJobs}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-surface-raised border border-border-default rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-text-secondary text-sm">Filter by status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Jobs</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border-default">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Video className="w-5 h-5 text-violet-400" />
            All Video Jobs
          </h2>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <FileVideo className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No video jobs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    User
                  </th>
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
                    <td className="px-6 py-4 text-sm text-text-primary">
                      <div>
                        <p className="font-medium">
                          {job.user?.email || job.user?.mobile || 'Unknown'}
                        </p>
                        {job.user?.name && (
                          <p className="text-xs text-text-muted">{job.user.name}</p>
                        )}
                      </div>
                    </td>
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
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

