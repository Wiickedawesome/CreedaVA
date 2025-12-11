import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Eye, MousePointer, Users, Globe } from 'lucide-react';

interface AnalyticsEvent {
  id: string;
  type: string;
  page: string;
  timestamp: string;
  metadata?: any;
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${API_BASE}/getAnalytics`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data || [])
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const pageViews = analytics.filter(a => a.type === 'page_view')
  const buttonClicks = analytics.filter(a => a.type === 'button_click')
  
  const stats = {
    totalPageViews: pageViews.length,
    totalClicks: buttonClicks.length,
    totalEvents: analytics.length,
    uniquePages: new Set(analytics.map(a => a.page)).size,
  };

  const topPages = pageViews.reduce((acc, curr) => {
    const existing = acc.find(p => p.page_path === curr.page);
    if (existing) {
      existing.page_views += 1;
    } else {
      acc.push({ page_path: curr.page, page_views: 1 });
    }
    return acc;
  }, [] as Array<{ page_path: string; page_views: number; }>).sort((a, b) => b.page_views - a.page_views).slice(0, 5);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Website performance and tracking metrics</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Page Views</h3>
            <Eye className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalPageViews.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Total tracked views</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Button Clicks</h3>
            <MousePointer className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalClicks.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">User interactions</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Events</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalEvents.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">All tracked events</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Unique Pages</h3>
            <Globe className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.uniquePages}</div>
          <p className="text-xs text-gray-500 mt-1">Pages visited</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Pages</h3>
            <p className="text-gray-600 text-sm">Most visited pages</p>
          </div>
          <div className="space-y-3">
            {topPages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No page view data yet.</p>
            ) : (
              topPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900">{page.page_path}</p>
                    <p className="text-xs text-gray-500">{page.page_views.toLocaleString()} views</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-gray-600 text-sm">Latest tracked events</p>
          </div>
          <div className="space-y-3">
            {analytics.slice(0, 5).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              analytics.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900">{item.type}</p>
                    <p className="text-xs text-gray-500">{item.page}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {analytics.length === 0 && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Analytics Tracking Active
            </h3>
            <p className="text-gray-600 text-sm mt-1">Connected to Azure Cosmos DB</p>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <p className="font-medium">✅ Your site is now tracking analytics with Azure!</p>
            <p>Data will start appearing here as visitors browse your site. Analytics are stored in:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Azure Cosmos DB - <code className="bg-white px-1.5 py-0.5 rounded text-xs">analytics</code> container</li>
              <li>Page views and button clicks are automatically tracked</li>
              <li>Check <a href="https://analytics.google.com/analytics/web/#/p471719022/reports/intelligenthome" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">Google Analytics Dashboard</a> for additional insights</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
