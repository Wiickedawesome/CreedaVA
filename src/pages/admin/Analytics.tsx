import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, MousePointer, Users, Globe, Calendar, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AnalyticsEvent {
  id: string;
  eventType: string;
  page: string;
  timestamp: string;
  sessionId?: string;
  metadata?: any;
}

interface AnalyticsSummary {
  totalEvents: number;
  uniquePages: number;
  eventTypes: Record<string, number>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(30);

  useEffect(() => { fetchAnalytics(); }, [daysFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${API_BASE}/getAnalytics?days=${daysFilter}`);
      
      if (response.ok) {
        const result = await response.json();
        setAnalytics(result.data || []);
        setSummary(result.summary || null);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const processTimeSeriesData = () => {
    const dayBuckets: Record<string, number> = {};
    
    analytics.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayBuckets[date] = (dayBuckets[date] || 0) + 1;
    });

    return Object.entries(dayBuckets)
      .map(([date, count]) => ({ date, events: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processEventTypeData = () => {
    if (!summary) return [];
    return Object.entries(summary.eventTypes).map(([name, value]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value
    }));
  };

  const processTopPages = () => {
    const pageCounts: Record<string, number> = {};
    
    analytics.forEach(event => {
      pageCounts[event.page] = (pageCounts[event.page] || 0) + 1;
    });

    return Object.entries(pageCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  };

  const timeSeriesData = processTimeSeriesData();
  const eventTypeData = processEventTypeData();
  const topPagesData = processTopPages();

  const stats = {
    totalEvents: summary?.totalEvents || 0,
    uniquePages: summary?.uniquePages || 0,
    pageViews: summary?.eventTypes['page_view'] || 0,
    interactions: Object.entries(summary?.eventTypes || {})
      .filter(([key]) => key !== 'page_view')
      .reduce((sum, [, val]) => sum + val, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-400">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Website performance and user tracking metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={daysFilter === 7 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDaysFilter(7)}
            className="text-xs"
          >
            7 Days
          </Button>
          <Button
            variant={daysFilter === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDaysFilter(30)}
            className="text-xs"
          >
            30 Days
          </Button>
          <Button
            variant={daysFilter === 90 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDaysFilter(90)}
            className="text-xs"
          >
            90 Days
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Events</h3>
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalEvents.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Last {daysFilter} days</p>
        </Card>
        
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Page Views</h3>
            <Eye className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.pageViews.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Unique page visits</p>
        </Card>
        
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Interactions</h3>
            <MousePointer className="h-5 w-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.interactions.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Clicks and events</p>
        </Card>
        
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Unique Pages</h3>
            <Globe className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.uniquePages}</div>
          <p className="text-xs text-gray-500 mt-1">Pages tracked</p>
        </Card>
      </div>

      {analytics.length === 0 ? (
        <Card className="p-8 bg-gray-800 border-gray-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Analytics Tracking Active</h3>
            <p className="text-gray-400 mb-4">Connected to Azure Cosmos DB</p>
            <div className="space-y-2 text-sm text-gray-300 text-left max-w-2xl mx-auto">
              <p className="font-medium text-green-400">✅ Your site is now tracking analytics with Azure!</p>
              <p>Data will start appearing here as visitors browse your site. Analytics are stored in:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-gray-400">
                <li>Azure Cosmos DB - <code className="bg-gray-700 px-2 py-1 rounded text-xs text-blue-300">analytics</code> container</li>
                <li>Page views, button clicks, and user interactions are automatically tracked</li>
                <li>Data is processed in real-time via Azure Functions</li>
              </ul>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Time Series Chart */}
          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Events Over Time</h3>
              <p className="text-gray-400 text-sm">Daily event tracking</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Area type="monotone" dataKey="events" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEvents)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Types Pie Chart */}
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Event Types</h3>
                <p className="text-gray-400 text-sm">Distribution of event categories</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Pages Bar Chart */}
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Top Pages</h3>
                <p className="text-gray-400 text-sm">Most visited pages</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topPagesData.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis dataKey="page" type="category" stroke="#9ca3af" width={120} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                  <Bar dataKey="views" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Recent Events Table */}
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Recent Events</h3>
              <p className="text-gray-400 text-sm">Latest tracked activity</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Event Type</TableHead>
                  <TableHead className="text-gray-400">Page</TableHead>
                  <TableHead className="text-gray-400">Timestamp</TableHead>
                  <TableHead className="text-gray-400">Session ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.slice(0, 10).map((event, index) => (
                  <TableRow key={index} className="border-gray-700">
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                        {event.eventType.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300 font-mono text-sm">{event.page}</TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs font-mono">
                      {event.sessionId?.substring(0, 8) || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
