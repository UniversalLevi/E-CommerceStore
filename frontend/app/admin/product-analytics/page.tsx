'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';
import IconBadge from '@/components/IconBadge';
import {
  Package,
  TrendingUp,
  DollarSign,
  Eye,
  Download,
  ShoppingBag,
  Target,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import Image from 'next/image';

// Interfaces
interface ProductAnalyticsSummary {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalBasePrice: number;
  totalSellingPrice: number;
  totalProfit: number;
  totalShippingRevenue: number;
  averageProfitMargin: number;
  averageProductPrice: number;
  totalViews: number;
  totalImports: number;
  totalConversions: number;
  conversionRate: number;
}

interface NicheRevenue {
  nicheId: string;
  nicheName: string;
  nicheIcon: string;
  productCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalBasePrice: number;
  averageProfitMargin: number;
  [key: string]: string | number; // Index signature for recharts compatibility
}

interface TopProduct {
  _id: string;
  title: string;
  price: number;
  basePrice: number;
  profit: number;
  shippingPrice: number;
  profitMargin: number;
  views: number;
  imports: number;
  conversions: number;
  conversionRate: number;
  niche: {
    _id: string;
    name: string;
    icon: string;
  } | null;
  images: string[];
  active: boolean;
  createdAt: string;
}

interface ProfitDistribution {
  range: string;
  count: number;
  minMargin: number;
  maxMargin: number;
}

interface ProductOverTime {
  date: string;
  count: number;
  totalRevenue: number;
  totalProfit: number;
}

interface Niche {
  _id: string;
  name: string;
  icon: string;
}

// Color palette for charts
const CHART_COLORS = [
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316', // Orange
];

export default function ProductAnalyticsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ProductAnalyticsSummary | null>(null);
  const [nicheRevenue, setNicheRevenue] = useState<NicheRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [profitDistribution, setProfitDistribution] = useState<ProfitDistribution[]>([]);
  const [productsOverTime, setProductsOverTime] = useState<ProductOverTime[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);

  // Table state
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [tablePagination, setTablePagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [tableFilters, setTableFilters] = useState({
    niche: '',
    active: '',
    search: '',
    sortBy: 'profit',
    order: 'desc',
  });
  const [tableLoading, setTableLoading] = useState(false);

  // Top products sort
  const [topSortBy, setTopSortBy] = useState<string>('profit');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAllData();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchTopProducts();
    }
  }, [topSortBy, isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchProductsTable();
    }
  }, [tablePagination.page, tableFilters, isAuthenticated, user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSummary(),
        fetchNicheRevenue(),
        fetchTopProducts(),
        fetchProfitDistribution(),
        fetchProductsOverTime(),
        fetchNiches(),
        fetchProductsTable(),
      ]);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      notify.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    const response = await api.get<{ success: boolean; data: ProductAnalyticsSummary }>(
      '/api/admin/product-analytics/summary'
    );
    setSummary(response.data);
  };

  const fetchNicheRevenue = async () => {
    const response = await api.get<{ success: boolean; data: NicheRevenue[] }>(
      '/api/admin/product-analytics/by-niche'
    );
    setNicheRevenue(response.data);
  };

  const fetchTopProducts = async () => {
    const response = await api.get<{ success: boolean; data: TopProduct[] }>(
      `/api/admin/product-analytics/top-products?sortBy=${topSortBy}&limit=10`
    );
    setTopProducts(response.data);
  };

  const fetchProfitDistribution = async () => {
    const response = await api.get<{ success: boolean; data: ProfitDistribution[] }>(
      '/api/admin/product-analytics/profit-distribution'
    );
    setProfitDistribution(response.data);
  };

  const fetchProductsOverTime = async () => {
    const response = await api.get<{ success: boolean; data: ProductOverTime[] }>(
      '/api/admin/product-analytics/over-time?days=30'
    );
    setProductsOverTime(response.data);
  };

  const fetchNiches = async () => {
    try {
      const response = await api.get<{ success: boolean; niches: Niche[] }>('/api/niches');
      setNiches(response.niches || []);
    } catch (error) {
      console.error('Error fetching niches:', error);
    }
  };

  const fetchProductsTable = async () => {
    try {
      setTableLoading(true);
      const params = new URLSearchParams();
      params.append('page', tablePagination.page.toString());
      params.append('limit', tablePagination.limit.toString());
      params.append('sortBy', tableFilters.sortBy);
      params.append('order', tableFilters.order);
      if (tableFilters.niche) params.append('niche', tableFilters.niche);
      if (tableFilters.active !== '') params.append('active', tableFilters.active);
      if (tableFilters.search) params.append('search', tableFilters.search);

      const response = await api.get<{
        success: boolean;
        data: {
          products: TopProduct[];
          pagination: { page: number; limit: number; total: number; pages: number };
        };
      }>(`/api/admin/product-analytics/products?${params.toString()}`);

      setProducts(response.data.products);
      setTablePagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching products table:', error);
    } finally {
      setTableLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleTableSort = (field: string) => {
    setTableFilters((prev) => ({
      ...prev,
      sortBy: field,
      order: prev.sortBy === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Product Analytics
            </span>
          </h1>
          <p className="mt-2 text-text-secondary">
            Track product performance, revenue, and profit margins
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-violet-300/70 font-medium">
                Total Products
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {summary?.totalProducts || 0}
              </p>
              <p className="text-sm text-violet-300/60 mt-1">
                <span className="text-emerald-400">{summary?.activeProducts || 0}</span> active
              </p>
            </div>
            <div className="p-3 bg-violet-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Package className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </div>

        {/* Total Selling Price */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/5 border border-emerald-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-300/70 font-medium">
                Total Catalog Value
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatCurrency(summary?.totalSellingPrice || 0)}
              </p>
              <p className="text-sm text-emerald-300/60 mt-1">
                Avg: {formatCurrency(summary?.averageProductPrice || 0)}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-amber-300/70 font-medium">
                Total Profit Potential
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatCurrency(summary?.totalProfit || 0)}
              </p>
              <p className="text-sm text-amber-300/60 mt-1">
                {(summary?.averageProfitMargin || 0).toFixed(1)}% avg margin
              </p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/5 border border-cyan-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-300/70 font-medium">
                Total Product Views
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatNumber(summary?.totalViews || 0)}
              </p>
              <p className="text-sm text-cyan-300/60 mt-1">
                {(summary?.conversionRate || 0).toFixed(1)}% conversion
              </p>
            </div>
            <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Eye className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-raised border border-border-default rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fuchsia-500/20 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Total Base Cost</p>
              <p className="text-lg font-bold text-text-primary">
                {formatCurrency(summary?.totalBasePrice || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Shipping Revenue</p>
              <p className="text-lg font-bold text-text-primary">
                {formatCurrency(summary?.totalShippingRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <Download className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Total Imports</p>
              <p className="text-lg font-bold text-text-primary">
                {formatNumber(summary?.totalImports || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lime-500/20 rounded-lg">
              <Target className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Total Conversions</p>
              <p className="text-lg font-bold text-text-primary">
                {formatNumber(summary?.totalConversions || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Niche */}
        <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue by Niche</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={nicheRevenue} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#666" tickFormatter={(v) => formatCurrency(v)} />
              <YAxis
                dataKey="nicheName"
                type="category"
                stroke="#666"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              />
              <Bar dataKey="totalRevenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit by Niche */}
        <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Profit by Niche</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={nicheRevenue}
                dataKey="totalProfit"
                nameKey="nicheName"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props: any) => {
                  const { nicheName, percent } = props;
                  return `${nicheName}: ${(percent * 100).toFixed(0)}%`;
                }}
                labelLine={false}
              >
                {nicheRevenue.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Profit']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Over Time */}
        <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Products Added (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={productsOverTime}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                stroke="#666"
                tickFormatter={(date) =>
                  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                }
              />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-IN')}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorCount)"
                name="Products"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Margin Distribution */}
        <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Profit Margin Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="range" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Products" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Section */}
      <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold text-text-primary">Top Performing Products</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Sort by:</span>
            <select
              value={topSortBy}
              onChange={(e) => setTopSortBy(e.target.value)}
              className="px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="profit">Profit</option>
              <option value="profitMargin">Profit Margin %</option>
              <option value="price">Price</option>
              <option value="views">Views</option>
              <option value="imports">Imports</option>
              <option value="conversions">Conversions</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {topProducts.slice(0, 5).map((product, index) => (
            <div
              key={product._id}
              className="bg-surface-elevated border border-border-default rounded-xl p-4 hover:border-violet-500/30 transition-all duration-300 group"
            >
              <div className="relative mb-3">
                <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/70 rounded-full text-xs font-bold text-white">
                  #{index + 1}
                </div>
                {product.images && product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-surface-base rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-text-muted" />
                  </div>
                )}
              </div>
              <h4 className="font-medium text-text-primary text-sm line-clamp-2 mb-2 group-hover:text-violet-400 transition-colors">
                {product.title}
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Price:</span>
                  <span className="text-text-primary font-medium">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Profit:</span>
                  <span className="text-emerald-400 font-medium">
                    {formatCurrency(product.profit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Margin:</span>
                  <span className="text-amber-400 font-medium">
                    {product.profitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
              {product.niche && (
                <div className="mt-2 pt-2 border-t border-border-default">
                  <span className="text-xs text-text-muted">
                    {product.niche.icon} {product.niche.name}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">All Products Analytics</h3>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={tableFilters.search}
              onChange={(e) =>
                setTableFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <select
            value={tableFilters.niche}
            onChange={(e) =>
              setTableFilters((prev) => ({ ...prev, niche: e.target.value }))
            }
            className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Niches</option>
            {niches.map((niche) => (
              <option key={niche._id} value={niche._id}>
                {niche.icon} {niche.name}
              </option>
            ))}
          </select>

          <select
            value={tableFilters.active}
            onChange={(e) =>
              setTableFilters((prev) => ({ ...prev, active: e.target.value }))
            }
            className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button
            onClick={() =>
              setTableFilters({
                niche: '',
                active: '',
                search: '',
                sortBy: 'profit',
                order: 'desc',
              })
            }
            className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* Table */}
        {tableLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mb-4"></div>
            <p className="text-text-secondary">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No products found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left py-3 px-4 text-text-secondary font-medium text-sm">
                      Product
                    </th>
                    <th
                      className="text-left py-3 px-4 text-text-secondary font-medium text-sm cursor-pointer hover:text-text-primary"
                      onClick={() => handleTableSort('basePrice')}
                    >
                      <div className="flex items-center gap-1">
                        Base Price
                        {tableFilters.sortBy === 'basePrice' &&
                          (tableFilters.order === 'desc' ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-4 text-text-secondary font-medium text-sm cursor-pointer hover:text-text-primary"
                      onClick={() => handleTableSort('price')}
                    >
                      <div className="flex items-center gap-1">
                        Selling Price
                        {tableFilters.sortBy === 'price' &&
                          (tableFilters.order === 'desc' ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-4 text-text-secondary font-medium text-sm cursor-pointer hover:text-text-primary"
                      onClick={() => handleTableSort('profit')}
                    >
                      <div className="flex items-center gap-1">
                        Profit
                        {tableFilters.sortBy === 'profit' &&
                          (tableFilters.order === 'desc' ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium text-sm">
                      Margin
                    </th>
                    <th
                      className="text-left py-3 px-4 text-text-secondary font-medium text-sm cursor-pointer hover:text-text-primary"
                      onClick={() => handleTableSort('views')}
                    >
                      <div className="flex items-center gap-1">
                        Views
                        {tableFilters.sortBy === 'views' &&
                          (tableFilters.order === 'desc' ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-4 text-text-secondary font-medium text-sm cursor-pointer hover:text-text-primary"
                      onClick={() => handleTableSort('imports')}
                    >
                      <div className="flex items-center gap-1">
                        Imports
                        {tableFilters.sortBy === 'imports' &&
                          (tableFilters.order === 'desc' ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium text-sm">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product._id}
                      className="border-b border-border-default hover:bg-surface-elevated transition-colors"
                      style={{ animation: `fadeIn 0.3s ease-out ${index * 0.02}s both` }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {product.images && product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-surface-base rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-text-muted" />
                            </div>
                          )}
                          <div>
                            <p className="text-text-primary font-medium text-sm line-clamp-1 max-w-[200px]">
                              {product.title}
                            </p>
                            {product.niche && (
                              <p className="text-xs text-text-muted">
                                {product.niche.icon} {product.niche.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-muted text-sm">
                        {formatCurrency(product.basePrice)}
                      </td>
                      <td className="py-3 px-4 text-text-primary font-medium text-sm">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-medium text-sm">
                          {formatCurrency(product.profit)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.profitMargin >= 50
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : product.profitMargin >= 25
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {product.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-sm">
                        {formatNumber(product.views)}
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-sm">
                        {formatNumber(product.imports)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.active
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {product.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <p className="text-text-secondary text-sm">
                Showing {(tablePagination.page - 1) * tablePagination.limit + 1} to{' '}
                {Math.min(tablePagination.page * tablePagination.limit, tablePagination.total)}{' '}
                of {tablePagination.total} products
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setTablePagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={tablePagination.page === 1}
                  className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setTablePagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={tablePagination.page >= tablePagination.pages}
                  className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

