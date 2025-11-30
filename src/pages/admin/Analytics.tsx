import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import { Database } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Eye, MousePointer, Users, Globe } from 'lucide-react';
import { format } from 'date-fns';

type AnalyticsData = Database['public']['Tables']['analytics_data']['Row'];

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await db.from('analytics_data').select('*').order('date', { ascending: false }).limit(30);
      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalPageViews: analytics.reduce((sum, a) => sum + (a.page_views || 0), 0),
    totalClicks: analytics.reduce((sum, a) => sum + (a.clicks || 0), 0),
    totalImpressions: analytics.reduce((sum, a) => sum + (a.impressions || 0), 0),
    avgCTR: analytics.length > 0 ? analytics.reduce((sum, a) => sum + (Number(a.ctr) || 0), 0) / analytics.length : 0,
    avgPosition: analytics.length > 0 ? analytics.reduce((sum, a) => sum + (Number(a.avg_position) || 0), 0) / analytics.length : 0
  };

  const topPages = analytics.slice(0, 10).reduce((acc, curr) => {
    const existing = acc.find(p => p.page_path === curr.page_path);
    if (existing) {
      existing.page_views += curr.page_views || 0;
      existing.clicks += curr.clicks || 0;
    } else {
      acc.push({ page_path: curr.page_path, page_views: curr.page_views || 0, clicks: curr.clicks || 0 });
    }
    return acc;
  }, [] as Array<{ page_path: string; page_views: number; clicks: number; }>).sort((a, b) => b.page_views - a.page_views).slice(0, 5);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;

  return (
    <div className="p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-gray-300 mt-1">Website performance and SEO metrics</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-600 p-4 rounded-lg border border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-100">Page Views</h3>
            <Eye className="h-4 w-4 text-blue-200" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalPageViews.toLocaleString()}</div>
          <p className="text-xs text-blue-100">Last 30 days</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg border border-green-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-100">Impressions</h3>
            <Globe className="h-4 w-4 text-green-200" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalImpressions.toLocaleString()}</div>
          <p className="text-xs text-green-100">Search results</p>
        </div>
        <div className="bg-yellow-600 p-4 rounded-lg border border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-yellow-100">Clicks</h3>
            <MousePointer className="h-4 w-4 text-yellow-200" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalClicks.toLocaleString()}</div>
          <p className="text-xs text-yellow-100">From search</p>
        </div>
        <div className="bg-purple-600 p-4 rounded-lg border border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-100">Avg CTR</h3>
            <TrendingUp className="h-4 w-4 text-purple-200" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.avgCTR.toFixed(2)}%</div>
          <p className="text-xs text-purple-100">Click-through rate</p>
        </div>
        <div className="bg-red-600 p-4 rounded-lg border border-red-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-100">Avg Position</h3>
            <Users className="h-4 w-4 text-red-200" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.avgPosition.toFixed(1)}</div>
          <p className="text-xs text-red-100">Search ranking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Top Pages</h3>
            <p className="text-gray-300 text-sm">Most visited pages (last 30 days)</p>
          </div>
          <div className="space-y-4">
            {topPages.length === 0 ? (
              <p className="text-sm text-gray-300 text-center py-4">No data yet. Add analytics data in Supabase to see metrics here.</p>
            ) : (
              topPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate text-white">{page.page_path}</p>
                    <p className="text-xs text-gray-300">{page.page_views.toLocaleString()} views • {page.clicks.toLocaleString()} clicks</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <p className="text-gray-300 text-sm">Latest analytics data points</p>
          </div>
          <div className="space-y-4">
            {analytics.slice(0, 5).length === 0 ? (
              <p className="text-sm text-gray-300 text-center py-4">No recent activity</p>
            ) : (
              analytics.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-600 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium truncate text-white">{item.page_path}</p>
                    <p className="text-xs text-gray-300">{format(new Date(item.date), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{item.page_views} views</p>
                    <p className="text-xs text-gray-300">{item.clicks} clicks</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {analytics.length === 0 && (
        <div className="bg-blue-800 p-6 rounded-lg border border-blue-600">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              Google Analytics Connected
            </h3>
            <p className="text-blue-200 text-sm">Tracking ID: G-MX1D5RQMQS</p>
          </div>
          <div className="space-y-3 text-sm">
            <p className="font-medium text-white">✅ Your site is now tracking analytics!</p>
            <p className="text-blue-200">Data will start appearing here within 24-48 hours. To see analytics data immediately:</p>
            <ol className="list-decimal list-inside space-y-2 text-blue-200 ml-2">
              <li>Visit your website and browse a few pages</li>
              <li>Check <a href="https://analytics.google.com/analytics/web/#/p471719022/reports/intelligenthome" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-100 hover:underline">Google Analytics Dashboard</a> for real-time data</li>
              <li>Set up Google Search Console integration for search data</li>
              <li>Or manually add test data to the <code className="bg-blue-700 text-blue-100 px-1 py-0.5 rounded">analytics_data</code> table in Supabase</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
