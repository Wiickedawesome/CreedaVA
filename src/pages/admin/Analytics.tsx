import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
      const { data, error } = await supabase.from('analytics_data').select('*').order('date', { ascending: false }).limit(30);
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

  if (loading) return <div className="flex items-center justify-center h-96 bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div><h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1><p className="text-slate-700 mt-2 font-medium">Website performance and SEO metrics</p></div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Page Views</CardTitle><Eye className="h-4 w-4 text-emerald-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalPageViews.toLocaleString()}</div><p className="text-xs text-slate-700">Last 30 days</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Impressions</CardTitle><Globe className="h-4 w-4 text-emerald-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</div><p className="text-xs text-slate-700">Search results</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clicks</CardTitle><MousePointer className="h-4 w-4 text-emerald-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div><p className="text-xs text-slate-700">From search</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg CTR</CardTitle><TrendingUp className="h-4 w-4 text-emerald-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.avgCTR.toFixed(2)}%</div><p className="text-xs text-slate-700">Click-through rate</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg Position</CardTitle><Users className="h-4 w-4 text-emerald-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.avgPosition.toFixed(1)}</div><p className="text-xs text-slate-700">Search ranking</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Top Pages</CardTitle><CardDescription>Most visited pages (last 30 days)</CardDescription></CardHeader><CardContent><div className="space-y-4">{topPages.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No data yet. Add analytics data in Supabase to see metrics here.</p> : topPages.map((page, i) => <div key={i} className="flex items-center justify-between"><div className="flex-1"><p className="text-sm font-medium truncate">{page.page_path}</p><p className="text-xs text-muted-foreground">{page.page_views.toLocaleString()} views • {page.clicks.toLocaleString()} clicks</p></div></div>)}</div></CardContent></Card>

        <Card><CardHeader><CardTitle>Recent Activity</CardTitle><CardDescription>Latest analytics data points</CardDescription></CardHeader><CardContent><div className="space-y-4">{analytics.slice(0, 5).length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p> : analytics.slice(0, 5).map((item, i) => <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0"><div><p className="text-sm font-medium truncate">{item.page_path}</p><p className="text-xs text-muted-foreground">{format(new Date(item.date), 'MMM d, yyyy')}</p></div><div className="text-right"><p className="text-sm font-medium">{item.page_views} views</p><p className="text-xs text-muted-foreground">{item.clicks} clicks</p></div></div>)}</div></CardContent></Card>
      </div>

      {analytics.length === 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Google Analytics Connected
            </CardTitle>
            <CardDescription>Tracking ID: G-MX1D5RQMQS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p className="font-medium">✅ Your site is now tracking analytics!</p>
              <p className="text-muted-foreground">Data will start appearing here within 24-48 hours. To see analytics data immediately:</p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                <li>Visit your website and browse a few pages</li>
                <li>Check <a href="https://analytics.google.com/analytics/web/#/p471719022/reports/intelligenthome" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Analytics Dashboard</a> for real-time data</li>
                <li>Set up Google Search Console integration for search data</li>
                <li>Or manually add test data to the <code className="bg-muted px-1 py-0.5 rounded">analytics_data</code> table in Supabase</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
