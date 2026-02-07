import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, Eye, MousePointer, Users, Globe, Globe2, Calendar, RefreshCw, Info, MapPin, Clock, ArrowRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_BASE, authorizedFetch } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorPanel } from '@/components/ErrorPanel';
import { CountryMap } from '@/components/CountryMap';

interface AnalyticsEvent {
  id: string;
  eventType: string;
  page: string;
  timestamp: string;
  sessionId?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: string;
  longitude?: string;
  clientIp?: string;
  eventData?: any;
  metadata?: any;
}

interface AnalyticsSummary {
  totalEvents: number;
  uniquePages: number;
  eventTypes: Record<string, number>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Event type descriptions for better UX
const EVENT_TYPE_INFO: Record<string, { label: string; description: string; icon: string }> = {
  'page_view': { label: 'Page View', description: 'User visited a page on your site', icon: '👁️' },
  'form_submission': { label: 'Form Submission', description: 'User submitted a contact or lead form', icon: '📝' },
  'button_click': { label: 'Button Click', description: 'User clicked an interactive element', icon: '🖱️' },
  'chat_interaction': { label: 'Chat Interaction', description: 'User engaged with the chatbot', icon: '💬' },
  'download': { label: 'Download', description: 'User downloaded a file or resource', icon: '⬇️' },
  'video_play': { label: 'Video Play', description: 'User played a video', icon: '▶️' },
  'scroll_depth': { label: 'Scroll Depth', description: 'User scrolled through content', icon: '📜' },
};

// Country code to name mapping (expanded list)
const COUNTRY_NAMES: Record<string, string> = {
  'US': '🇺🇸 United States',
  'GB': '🇬🇧 United Kingdom',
  'CA': '🇨🇦 Canada',
  'AU': '🇦🇺 Australia',
  'DE': '🇩🇪 Germany',
  'FR': '🇫🇷 France',
  'ES': '🇪🇸 Spain',
  'IT': '🇮🇹 Italy',
  'BR': '🇧🇷 Brazil',
  'MX': '🇲🇽 Mexico',
  'IN': '🇮🇳 India',
  'CN': '🇨🇳 China',
  'JP': '🇯🇵 Japan',
  'KR': '🇰🇷 South Korea',
  'NL': '🇳🇱 Netherlands',
  'SE': '🇸🇪 Sweden',
  'NO': '🇳🇴 Norway',
  'DK': '🇩🇰 Denmark',
  'FI': '🇫🇮 Finland',
  'PL': '🇵🇱 Poland',
  'BE': '🇧🇪 Belgium',
  'CH': '🇨🇭 Switzerland',
  'AT': '🇦🇹 Austria',
  'IE': '🇮🇪 Ireland',
  'PT': '🇵🇹 Portugal',
  'GR': '🇬🇷 Greece',
  'CZ': '🇨🇿 Czech Republic',
  'RO': '🇷🇴 Romania',
  'HU': '🇭🇺 Hungary',
  'RU': '🇷🇺 Russia',
  'TR': '🇹🇷 Turkey',
  'ZA': '🇿🇦 South Africa',
  'NG': '🇳🇬 Nigeria',
  'EG': '🇪🇬 Egypt',
  'KE': '🇰🇪 Kenya',
  'SG': '🇸🇬 Singapore',
  'MY': '🇲🇾 Malaysia',
  'TH': '🇹🇭 Thailand',
  'ID': '🇮🇩 Indonesia',
  'PH': '🇵🇭 Philippines',
  'VN': '🇻🇳 Vietnam',
  'NZ': '🇳🇿 New Zealand',
  'AR': '🇦🇷 Argentina',
  'CL': '🇨🇱 Chile',
  'CO': '🇨🇴 Colombia',
  'PE': '🇵🇪 Peru',
  'VE': '🇻🇪 Venezuela',
  'IL': '🇮🇱 Israel',
  'AE': '🇦🇪 UAE',
  'SA': '🇸🇦 Saudi Arabia',
  'PK': '🇵🇰 Pakistan',
  'BD': '🇧🇩 Bangladesh',
  'UA': '🇺🇦 Ukraine',
};

const getEventTypeInfo = (eventType: string) => {
  return EVENT_TYPE_INFO[eventType] || { 
    label: eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
    description: 'User interaction event',
    icon: '📊'
  };
};

const getCountryName = (code?: string) => {
  if (!code || code === 'Unknown' || code === 'N/A') return '🌐 Location Unknown';
  return COUNTRY_NAMES[code] || `🌍 ${code}`;
};

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(30);
  const [showAdminPages, setShowAdminPages] = useState(false); // Toggle for admin pages
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
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
    
    return Object.entries(eventCounts).map(([eventType, value]) => ({
      name: getEventTypeInfo(eventType).label,
      value,
      eventType // Keep original for reference
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
      .map(([countryCode, count]) => ({ 
        country: getCountryName(countryCode),
        countryCode,
        count 
      }))
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

  // Peak hours analysis
  const processPeakHours = () => {
    const hourCounts: Record<number, number> = {};
    
    filteredAnalytics.forEach(event => {
      if (event.timestamp) {
        const date = new Date(event.timestamp);
        const hour = date.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const maxCount = Math.max(...Object.values(hourCounts), 1);
    
    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count: hourCounts[hour] || 0,
      intensity: hourCounts[hour] ? (hourCounts[hour] / maxCount) * 100 : 0
    }));
  };

  const timeSeriesData = processTimeSeriesData();
  const eventTypeData = processEventTypeData();
  const topPagesData = processTopPages();
  const countryData = processCountryData();
  const funnelData = processFunnelData();
  const eventInsights = processEventInsights();
  const peakHours = processPeakHours();

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
                  <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
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
          {/* SECTION: OVERVIEW TRENDS */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-400" />
              Trends & Activity
            </h2>
            <p className="text-gray-400 text-sm mt-1">Monitor visitor behavior over time</p>
          </div>

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

          {/* SECTION: EVENT BREAKDOWN */}
          <div className="my-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Eye className="h-6 w-6 text-green-400" />
              Event Breakdown
            </h2>
            <p className="text-gray-400 text-sm mt-1">What visitors are doing on your site</p>
          </div>

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

          {/* Peak Hours Heatmap */}
          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Peak Activity Hours</h3>
              <p className="text-gray-400 text-sm">When your visitors are most active (24-hour format)</p>
            </div>
            <div className="grid grid-cols-12 gap-2">
              {peakHours.map((hourData) => {
                const intensity = hourData.intensity;
                const bgColor = intensity === 0 ? 'bg-gray-700/20' :
                               intensity < 25 ? 'bg-blue-500/20' :
                               intensity < 50 ? 'bg-blue-500/40' :
                               intensity < 75 ? 'bg-blue-500/60' :
                               'bg-blue-500/80';
                
                return (
                  <div
                    key={hourData.hour}
                    className={`${bgColor} rounded-lg p-3 text-center transition-all hover:scale-105 cursor-pointer relative group`}
                    title={`${hourData.hour}: ${hourData.count} events`}
                  >
                    <p className="text-xs text-gray-400 font-medium">{hourData.hour.split(':')[0]}</p>
                    <p className="text-sm text-white font-semibold mt-1">{hourData.count}</p>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {hourData.count} events
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>Midnight</span>
              <span>Noon</span>
              <span>Midnight</span>
            </div>
          </Card>

          {/* SECTION: GEOGRAPHIC INSIGHTS */}
          <div className="my-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Globe className="h-6 w-6 text-purple-400" />
              Geographic Insights
            </h2>
            <p className="text-gray-400 text-sm mt-1">Where your visitors are coming from</p>
          </div>

          {/* Country Distribution Map - NEW ENHANCED VERSION */}
          <CountryMap countryData={countryData} />

          {/* SECTION: RECENT ACTIVITY */}
          <div className="my-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange-400" />
              Recent Activity
            </h2>
            <p className="text-gray-400 text-sm mt-1">Live feed of user interactions</p>
          </div>

          {/* Recent Events Table */}
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Recent Events
                  </h3>
                  <p className="text-gray-400 text-sm">Click any event to see full details</p>
                </div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Event Type</TableHead>
                  <TableHead className="text-gray-400">Page</TableHead>
                  <TableHead className="text-gray-400">Location</TableHead>
                  <TableHead className="text-gray-400">Timestamp</TableHead>
                  <TableHead className="text-gray-400">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalytics.slice(0, 15).map((event, index) => {
                  const eventInfo = getEventTypeInfo(event.eventType);
                  return (
                    <TableRow 
                      key={index} 
                      className="border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsEventModalOpen(true);
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{eventInfo.icon}</span>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                            {eventInfo.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">{event.page || '/'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-300 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {event.city && event.city !== 'Unknown' 
                              ? `${event.city}, ${getCountryName(event.country)}`
                              : getCountryName(event.country)
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-blue-400 hover:text-blue-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setIsEventModalOpen(true);
                          }}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Event Details Modal */}
          <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  {selectedEvent && (
                    <>
                      <span className="text-2xl">{getEventTypeInfo(selectedEvent.eventType).icon}</span>
                      Event Details
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {selectedEvent && getEventTypeInfo(selectedEvent.eventType).description}
                </DialogDescription>
              </DialogHeader>
              
              {selectedEvent && (
                <div className="space-y-4 mt-4">
                  {/* Event Type */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-900/50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Event Type</p>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {getEventTypeInfo(selectedEvent.eventType).label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Page</p>
                      <p className="text-sm font-mono text-gray-300">{selectedEvent.page || '/'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Timestamp</p>
                      <p className="text-sm text-gray-300">
                        {new Date(selectedEvent.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900/50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Globe2 className="h-3 w-3" />
                        Country
                      </p>
                      <p className="text-sm text-gray-300">{getCountryName(selectedEvent.country)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Region
                      </p>
                      <p className="text-sm text-gray-300">{selectedEvent.region || 'Not Available'}</p>
                    </div>
                    {selectedEvent.city && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          City
                        </p>
                        <p className="text-sm text-gray-300">{selectedEvent.city}</p>
                      </div>
                    )}
                    {selectedEvent.timezone && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Timezone
                        </p>
                        <p className="text-sm text-gray-300">{selectedEvent.timezone}</p>
                      </div>
                    )}
                    {selectedEvent.latitude && selectedEvent.longitude && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Coordinates
                        </p>
                        <p className="text-sm font-mono text-gray-300">
                          {selectedEvent.latitude}, {selectedEvent.longitude}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Session Info */}
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Session ID</p>
                    <code className="text-xs font-mono bg-gray-950 px-3 py-2 rounded block text-green-400">
                      {selectedEvent.sessionId || 'No session ID'}
                    </code>
                  </div>

                  {/* IP Address (if available) */}
                  {selectedEvent.clientIp && (
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Client IP</p>
                      <code className="text-xs font-mono bg-gray-950 px-3 py-2 rounded block text-blue-400">
                        {selectedEvent.clientIp}
                      </code>
                    </div>
                  )}

                  {/* Additional Metadata */}
                  {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Additional Data</p>
                      <pre className="text-xs font-mono bg-gray-950 px-3 py-2 rounded overflow-x-auto text-purple-400">
                        {JSON.stringify(selectedEvent.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Event ID */}
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Event ID</p>
                    <code className="text-xs font-mono bg-gray-950 px-3 py-2 rounded block text-gray-400">
                      {selectedEvent.id}
                    </code>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
