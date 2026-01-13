import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, MousePointer, Users, Globe, Calendar, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_BASE, authorizedFetch } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext'
import { ErrorPanel } from '@/components/ErrorPanel'

interface AnalyticsEvent {
  id: string;
  eventType: string;
  page: string;
  timestamp: string;
  sessionId?: string;
  country?: string;
  region?: string;
  clientIp?: string;
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
  const [showAdminPages, setShowAdminPages] = useState(false); // Toggle for admin pages
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const { signIn } = useAuth()

  // Filter function to exclude admin pages
  const isAdminPage = (page: string) => {
    return page.startsWith('/admin') || 
           page === '/login' || 
           page === '/signup' || 
           page === '/env-check';
  };

  // Get filtered analytics based on toggle
  const filteredAnalytics = showAdminPages 
    ? analytics 
    : analytics.filter(event => !isAdminPage(event.page));

  useEffect(() => { fetchAnalytics(); }, [daysFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await authorizedFetch(`${API_BASE}/getAnalytics?days=${daysFilter}`);
      
      if (response.ok) {
        const result = await response.json();
        setAnalytics(result.data || []);
        setSummary(result.summary || null);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
      setErrorStatus(err?.status || null)
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts (using filtered data)
  const processTimeSeriesData = () => {
    const dayBuckets: Record<string, number> = {};
    
    filteredAnalytics.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayBuckets[date] = (dayBuckets[date] || 0) + 1;
    });

    return Object.entries(dayBuckets)
      .map(([date, count]) => ({ date, events: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processEventTypeData = () => {
    const eventCounts: Record<string, number> = {};
    
    filteredAnalytics.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });
    
    return Object.entries(eventCounts).map(([name, value]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value
    }));
  };

  const processTopPages = () => {
    const pageCounts: Record<string, number> = {};
    
    filteredAnalytics.forEach(event => {
      pageCounts[event.page] = (pageCounts[event.page] || 0) + 1;
    });

    return Object.entries(pageCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  };

  const processCountryData = () => {
    const countryCounts: Record<string, number> = {};
    
    filteredAnalytics.forEach(event => {
      const country = event.country || 'Unknown';
      if (country && country !== '-') {
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      }
    });

    return Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // Event insights breakdown
  const processEventInsights = () => {
    const pageViews = filteredAnalytics.filter(e => e.eventType === 'page_view');
    const buttonClicks = filteredAnalytics.filter(e => e.eventType === 'button_click');
    const formSubmits = filteredAnalytics.filter(e => e.eventType === 'form_submit');
    
    // Top pages
    const pageViewCounts = pageViews.reduce((acc, e) => {
      const page = e.eventData?.page || e.page || 'Unknown';
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPages = Object.entries(pageViewCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Top interactions
    const interactionCounts = [...buttonClicks, ...formSubmits].reduce((acc, e) => {
      const action = e.eventData?.action || e.eventData?.label || e.eventType || 'Unknown';
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topInteractions = Object.entries(interactionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return { topPages, topInteractions };
  };

  // Conversion Funnel Analysis
  const processFunnelData = () => {
    const funnelSteps = [
      { step: 'Home', page: '/', name: 'Homepage Visits' },
      { step: 'Services', page: '/services', name: 'Viewed Services' },
      { step: 'Pricing', page: '/pricing', name: 'Checked Pricing' },
      { step: 'Contact', page: '/contact', name: 'Reached Contact' }
    ];

    const sessions = new Set(filteredAnalytics.map(e => e.sessionId).filter(Boolean));
    const totalSessions = sessions.size || filteredAnalytics.length;

    return funnelSteps.map((step, index) => {
      const count = filteredAnalytics.filter(e => e.page === step.page).length;
      const percentage = totalSessions > 0 ? (count / totalSessions) * 100 : 0;
      const dropoff = index > 0 ? funnelSteps[index - 1] : null;
      const previousCount = dropoff ? filteredAnalytics.filter(e => e.page === dropoff.page).length : totalSessions;
      const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 0;

      return {
        ...step,
        count,
        percentage: Math.round(percentage),
        conversionRate: Math.round(conversionRate),
        dropoff: previousCount > 0 ? Math.round(((previousCount - count) / previousCount) * 100) : 0
      };
    });
  };

  const timeSeriesData = processTimeSeriesData();
  const eventTypeData = processEventTypeData();
  const topPagesData = processTopPages();
  const countryData = processCountryData();
  const funnelData = processFunnelData();
  const eventInsights = processEventInsights();

  const stats = {
    totalEvents: filteredAnalytics.length,
    uniquePages: new Set(filteredAnalytics.map(e => e.page)).size,
    pageViews: filteredAnalytics.filter(e => e.eventType === 'page_view').length,
    interactions: filteredAnalytics.filter(e => e.eventType !== 'page_view').length
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
          <p className="text-gray-400 mt-1">
            {showAdminPages ? 'All traffic including admin pages' : 'Customer traffic only'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showAdminPages ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAdminPages(!showAdminPages)}
            className={`text-xs ${showAdminPages ? 'bg-purple-600 text-white' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}
          >
            {showAdminPages ? '👥 All Traffic' : '🌐 Customers Only'}
          </Button>
          <div className="w-px h-6 bg-gray-600"></div>
          <Button
            variant={daysFilter === 7 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDaysFilter(7)}
            className={`text-xs ${daysFilter === 7 ? 'bg-blue-600 text-white' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}
          >
            7 Days
          </Button>
          <Button
            variant={daysFilter === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDaysFilter(30)}
            className={`text-xs ${daysFilter === 30 ? 'bg-blue-600 text-white' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}
          >
            30 Days
          </Button>
          <Button
            variant={daysFilter === 90 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDaysFilter(90)}
            className={`text-xs ${daysFilter === 90 ? 'bg-blue-600 text-white' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}
          >
            90 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAnalytics}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
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

      {/* Conversion Funnel */}
      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Customer Journey Funnel</h3>
          <p className="text-gray-400 text-sm">Track how visitors navigate through your site</p>
        </div>
        <div className="space-y-4">
          {funnelData.map((step, index) => {
            const width = step.percentage;
            const isLast = index === funnelData.length - 1;
            
            return (
              <div key={step.step} className="relative">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{step.name}</span>
                      <span className="text-gray-400 text-sm">{step.count} visits</span>
                    </div>
                    <div className="h-8 bg-gray-700 rounded-lg overflow-hidden relative">
                      <div 
                        className={`h-full ${isLast ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-500`}
                        style={{ width: `${width}%` }}
                      >
                        <div className="flex items-center justify-between h-full px-3">
                          <span className="text-white text-sm font-semibold">{step.percentage}%</span>
                          {index > 0 && (
                            <span className="text-white/80 text-xs">
                              {step.conversionRate}% conversion
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {index > 0 && step.dropoff > 0 && (
                      <p className="text-xs text-red-400 mt-1">
                        ↓ {step.dropoff}% drop-off from previous step
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Overall Conversion Rate:</span>
            <span className="text-green-400 font-semibold text-lg">
              {funnelData.length > 0 && funnelData[0].count > 0 
                ? Math.round((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100) 
                : 0}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Visitors who complete the full journey from homepage to contact
          </p>
        </div>
      </Card>

      {/* Event Insights - Top Pages & Interactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Top Pages</h3>
            <p className="text-gray-400 text-sm">Most visited customer pages</p>
          </div>
          <div className="space-y-3">
            {eventInsights.topPages.map((page, index) => (
              <div key={page.page} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{page.page}</p>
                    <p className="text-gray-400 text-xs">{page.count} views</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{page.count}</p>
                  <p className="text-gray-500 text-xs">
                    {stats.pageViews > 0 ? Math.round((page.count / stats.pageViews) * 100) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Top Interactions</h3>
            <p className="text-gray-400 text-sm">Most common user actions</p>
          </div>
          <div className="space-y-3">
            {eventInsights.topInteractions.map((interaction, index) => (
              <div key={interaction.action} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{interaction.action}</p>
                    <p className="text-gray-400 text-xs">{interaction.count} clicks</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{interaction.count}</p>
                  <p className="text-gray-500 text-xs">
                    {stats.interactions > 0 ? Math.round((interaction.count / stats.interactions) * 100) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {error ? (
        <ErrorPanel message={error} onRetry={fetchAnalytics} onSignIn={errorStatus === 401 ? async () => { await signIn(); fetchAnalytics() } : undefined} />
      ) : analytics.length === 0 ? (
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

          {/* Country Distribution Chart */}
          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Visitors by Country</h3>
              <p className="text-gray-400 text-sm">Geographic distribution</p>
            </div>
            {countryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryData.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis dataKey="country" type="category" stroke="#9ca3af" width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Country data will appear as visitors access your site
              </div>
            )}
          </Card>

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
                  <TableHead className="text-gray-400">Country</TableHead>
                  <TableHead className="text-gray-400">Timestamp</TableHead>
                  <TableHead className="text-gray-400">Session ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalytics.slice(0, 15).map((event, index) => (
                  <TableRow key={index} className="border-gray-700">
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                        {event.eventType.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300 font-mono text-sm">{event.page}</TableCell>
                    <TableCell>
                      <span className="text-gray-300">
                        {event.country || 'Unknown'}
                      </span>
                    </TableCell>
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
