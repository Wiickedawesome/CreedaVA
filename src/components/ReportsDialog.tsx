import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BarChart, LineChart, Calendar, Download, Mail, Share, Clock, Filter, Database, Plus, X, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

interface Report {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'sales' | 'marketing' | 'financial' | 'custom';
  reportType: 'dashboard' | 'table' | 'chart' | 'summary' | 'detailed';
  dataSource: {
    type: 'analytics' | 'crm' | 'email' | 'social' | 'ads' | 'database';
    connection: string;
    queries: Array<{
      name: string;
      query: string;
      filters: Record<string, any>;
    }>;
  };
  visualization: {
    chartTypes: string[];
    layout: 'single' | 'grid' | 'tabs' | 'accordion';
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    settings: Record<string, any>;
  };
  filters: Array<{
    id: string;
    name: string;
    type: 'date' | 'select' | 'multiselect' | 'number' | 'text';
    options?: string[];
    defaultValue?: any;
    required: boolean;
  }>;
  schedule: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    timezone: string;
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv' | 'json';
  };
  sharing: {
    isPublic: boolean;
    publicUrl?: string;
    password?: string;
    allowedDomains: string[];
    embedCode?: string;
  };
  permissions: {
    viewers: string[];
    editors: string[];
    admins: string[];
  };
  metadata: {
    tags: string[];
    lastGenerated?: Date;
    nextScheduled?: Date;
    executionTime: number;
    rowCount: number;
    fileSize: string;
  };
  alerts: Array<{
    id: string;
    metric: string;
    condition: 'above' | 'below' | 'equals' | 'changes';
    threshold: number;
    recipients: string[];
    enabled: boolean;
  }>;
  exportHistory: Array<{
    id: string;
    format: string;
    generatedAt: Date;
    downloadUrl: string;
    fileSize: string;
  }>;
  status: 'active' | 'draft' | 'archived' | 'error';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Report, 'id'>) => void;
  report?: Report;
}

const reportCategories = [
  { id: 'analytics', name: 'Web Analytics', description: 'Website traffic and user behavior' },
  { id: 'sales', name: 'Sales', description: 'Sales performance and revenue' },
  { id: 'marketing', name: 'Marketing', description: 'Campaign performance and ROI' },
  { id: 'financial', name: 'Financial', description: 'Financial metrics and reports' },
  { id: 'custom', name: 'Custom', description: 'Custom data sources and metrics' }
];

const chartTypes = [
  { id: 'line', name: 'Line Chart', icon: LineChart },
  { id: 'bar', name: 'Bar Chart', icon: BarChart },
  { id: 'pie', name: 'Pie Chart', icon: Database },
  { id: 'area', name: 'Area Chart', icon: LineChart },
  { id: 'table', name: 'Data Table', icon: Filter },
  { id: 'metric', name: 'Metric Card', icon: Eye },
  { id: 'gauge', name: 'Gauge', icon: BarChart },
  { id: 'heatmap', name: 'Heatmap', icon: Database }
];

const dataSources = [
  { id: 'analytics', name: 'Google Analytics', description: 'Web analytics data' },
  { id: 'crm', name: 'CRM System', description: 'Customer and lead data' },
  { id: 'email', name: 'Email Marketing', description: 'Email campaign metrics' },
  { id: 'social', name: 'Social Media', description: 'Social media analytics' },
  { id: 'ads', name: 'Advertising', description: 'Ad campaign performance' },
  { id: 'database', name: 'Custom Database', description: 'Custom SQL queries' }
];

export function ReportsDialog({ isOpen, onClose, onSave, report }: ReportsDialogProps) {
  const [formData, setFormData] = useState<Omit<Report, 'id'>>({
    name: '',
    description: '',
    category: 'analytics',
    reportType: 'dashboard',
    dataSource: {
      type: 'analytics',
      connection: '',
      queries: [{ name: 'Main Query', query: '', filters: {} }]
    },
    visualization: {
      chartTypes: ['line'],
      layout: 'single',
      colors: {
        primary: '#3B82F6',
        secondary: '#1F2937',
        accent: '#10B981'
      },
      settings: {}
    },
    filters: [],
    schedule: {
      enabled: false,
      frequency: 'weekly',
      time: '09:00',
      timezone: 'UTC',
      recipients: [],
      format: 'pdf'
    },
    sharing: {
      isPublic: false,
      allowedDomains: []
    },
    permissions: {
      viewers: [],
      editors: [],
      admins: []
    },
    metadata: {
      tags: [],
      executionTime: 0,
      rowCount: 0,
      fileSize: '0KB'
    },
    alerts: [],
    exportHistory: [],
    status: 'draft',
    userId: 'current-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [newTag, setNewTag] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newFilter, setNewFilter] = useState({ name: '', type: 'text', required: false });
  const [newAlert, setNewAlert] = useState({ metric: '', condition: 'above', threshold: 0, recipients: [] });
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (report) {
      setFormData(report);
      setScheduleDate(report.metadata.nextScheduled ? new Date(report.metadata.nextScheduled) : undefined);
    }
  }, [report]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (category: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category as keyof typeof prev] as any, [field]: value }
    }));
  };

  const handleArrayAdd = (category: string, field: string, item: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev] as any,
        [field]: [...(prev[category as keyof typeof prev] as any)[field], item]
      }
    }));
  };

  const handleArrayRemove = (category: string, field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev] as any,
        [field]: (prev[category as keyof typeof prev] as any)[field].filter((_: any, i: number) => i !== index)
      }
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      handleArrayAdd('metadata', 'tags', newTag.trim());
      setNewTag('');
    }
  };

  const addRecipient = () => {
    if (newRecipient.trim()) {
      handleArrayAdd('schedule', 'recipients', newRecipient.trim());
      setNewRecipient('');
    }
  };

  const addFilter = () => {
    if (newFilter.name.trim()) {
      const filter = {
        id: Date.now().toString(),
        name: newFilter.name,
        type: newFilter.type as any,
        required: newFilter.required
      };
      handleArrayAdd('filters', '', filter);
      setNewFilter({ name: '', type: 'text', required: false });
    }
  };

  const addAlert = () => {
    if (newAlert.metric.trim()) {
      const alert = {
        id: Date.now().toString(),
        metric: newAlert.metric,
        condition: newAlert.condition as any,
        threshold: newAlert.threshold,
        recipients: newAlert.recipients,
        enabled: true
      };
      handleArrayAdd('alerts', '', alert);
      setNewAlert({ metric: '', condition: 'above', threshold: 0, recipients: [] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      metadata: {
        ...formData.metadata,
        nextScheduled: scheduleDate
      },
      updatedAt: new Date().toISOString()
    };
    onSave(dataToSave);
  };

  const generateSampleQuery = (dataSource: string) => {
    const queries = {
      analytics: 'SELECT date, sessions, pageviews, bounce_rate FROM analytics_data WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
      crm: 'SELECT created_date, lead_source, status, value FROM leads WHERE created_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
      email: 'SELECT sent_date, campaign_name, opens, clicks, conversions FROM email_campaigns WHERE sent_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
      social: 'SELECT post_date, platform, engagement, reach, shares FROM social_posts WHERE post_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
      ads: 'SELECT date, campaign_name, impressions, clicks, conversions, cost FROM ad_campaigns WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
      database: 'SELECT * FROM your_table WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    };
    return queries[dataSource as keyof typeof queries] || '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {report ? 'Edit Report' : 'Create New Report'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {report ? 'Modify report settings and configuration.' : 'Create a comprehensive report with custom dashboards and automated scheduling.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gray-800">
              <TabsTrigger value="basic" className="data-[state=active]:bg-gray-700">Basic</TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-gray-700">Data Source</TabsTrigger>
              <TabsTrigger value="visualization" className="data-[state=active]:bg-gray-700">Visualization</TabsTrigger>
              <TabsTrigger value="schedule" className="data-[state=active]:bg-gray-700">Schedule</TabsTrigger>
              <TabsTrigger value="sharing" className="data-[state=active]:bg-gray-700">Sharing</TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-gray-700">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Report Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Monthly Analytics Report"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} - {category.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Brief description of what this report contains"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Report Type</Label>
                  <Select value={formData.reportType} onValueChange={(value) => handleInputChange('reportType', value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard - Interactive charts</SelectItem>
                      <SelectItem value="table">Table - Data in tabular format</SelectItem>
                      <SelectItem value="chart">Chart - Single visualization</SelectItem>
                      <SelectItem value="summary">Summary - Key metrics overview</SelectItem>
                      <SelectItem value="detailed">Detailed - Comprehensive analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.metadata.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-700 text-white">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArrayRemove('metadata', 'tags', index)}
                        className="ml-1 h-4 w-4 p-0 hover:bg-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Data Source</Label>
                <Select 
                  value={formData.dataSource.type} 
                  onValueChange={(value) => handleNestedInputChange('dataSource', 'type', value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources.map(source => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name} - {source.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Connection String</Label>
                <Input
                  value={formData.dataSource.connection}
                  onChange={(e) => handleNestedInputChange('dataSource', 'connection', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Database connection string or API endpoint"
                />
              </div>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Queries
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Define the data queries for your report
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.dataSource.queries.map((query, index) => (
                    <div key={index} className="space-y-2 p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Input
                          value={query.name}
                          onChange={(e) => {
                            const updatedQueries = [...formData.dataSource.queries];
                            updatedQueries[index].name = e.target.value;
                            handleNestedInputChange('dataSource', 'queries', updatedQueries);
                          }}
                          className="bg-gray-600 border-gray-500 text-white"
                          placeholder="Query name"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const query = generateSampleQuery(formData.dataSource.type);
                            const updatedQueries = [...formData.dataSource.queries];
                            updatedQueries[index].query = query;
                            handleNestedInputChange('dataSource', 'queries', updatedQueries);
                          }}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          ✨ Generate Sample
                        </Button>
                      </div>
                      <Textarea
                        value={query.query}
                        onChange={(e) => {
                          const updatedQueries = [...formData.dataSource.queries];
                          updatedQueries[index].query = e.target.value;
                          handleNestedInputChange('dataSource', 'queries', updatedQueries);
                        }}
                        className="bg-gray-600 border-gray-500 text-white font-mono"
                        placeholder="SELECT * FROM table WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
                        rows={4}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visualization" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Chart Types</Label>
                <div className="grid grid-cols-4 gap-3">
                  {chartTypes.map(chart => {
                    const Icon = chart.icon;
                    const isSelected = formData.visualization.chartTypes.includes(chart.id);
                    return (
                      <div
                        key={chart.id}
                        onClick={() => {
                          const currentTypes = formData.visualization.chartTypes;
                          const newTypes = isSelected
                            ? currentTypes.filter(type => type !== chart.id)
                            : [...currentTypes, chart.id];
                          handleNestedInputChange('visualization', 'chartTypes', newTypes);
                        }}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-900/20' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                        <p className={`text-sm text-center ${isSelected ? 'text-blue-400' : 'text-gray-300'}`}>
                          {chart.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Layout</Label>
                <Select 
                  value={formData.visualization.layout} 
                  onValueChange={(value) => handleNestedInputChange('visualization', 'layout', value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single View</SelectItem>
                    <SelectItem value="grid">Grid Layout</SelectItem>
                    <SelectItem value="tabs">Tabbed Layout</SelectItem>
                    <SelectItem value="accordion">Accordion Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Color Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.visualization.colors.primary}
                          onChange={(e) => handleNestedInputChange('visualization', 'colors', { ...formData.visualization.colors, primary: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <input
                          type="color"
                          value={formData.visualization.colors.primary}
                          onChange={(e) => handleNestedInputChange('visualization', 'colors', { ...formData.visualization.colors, primary: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-600"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.visualization.colors.secondary}
                          onChange={(e) => handleNestedInputChange('visualization', 'colors', { ...formData.visualization.colors, secondary: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <input
                          type="color"
                          value={formData.visualization.colors.secondary}
                          onChange={(e) => handleNestedInputChange('visualization', 'colors', { ...formData.visualization.colors, secondary: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-600"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.visualization.colors.accent}
                          onChange={(e) => handleNestedInputChange('visualization', 'colors', { ...formData.visualization.colors, accent: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <input
                          type="color"
                          value={formData.visualization.colors.accent}
                          onChange={(e) => handleNestedInputChange('visualization', 'colors', { ...formData.visualization.colors, accent: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.schedule.enabled}
                  onCheckedChange={(checked) => handleNestedInputChange('schedule', 'enabled', checked)}
                />
                <Label className="text-white">Enable Automatic Scheduling</Label>
              </div>

              {formData.schedule.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Frequency</Label>
                      <Select 
                        value={formData.schedule.frequency} 
                        onValueChange={(value: any) => handleNestedInputChange('schedule', 'frequency', value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Time</Label>
                      <Input
                        type="time"
                        value={formData.schedule.time}
                        onChange={(e) => handleNestedInputChange('schedule', 'time', e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Export Format</Label>
                      <Select 
                        value={formData.schedule.format} 
                        onValueChange={(value: any) => handleNestedInputChange('schedule', 'format', value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Email Recipients</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newRecipient}
                        onChange={(e) => setNewRecipient(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="email@example.com"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                      />
                      <Button type="button" onClick={addRecipient} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.schedule.recipients.map((email, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-700 text-white">
                          {email}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArrayRemove('schedule', 'recipients', index)}
                            className="ml-1 h-4 w-4 p-0 hover:bg-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sharing" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.sharing.isPublic}
                  onCheckedChange={(checked) => handleNestedInputChange('sharing', 'isPublic', checked)}
                />
                <Label className="text-white">Make Report Public</Label>
              </div>

              {formData.sharing.isPublic && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Public URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.sharing.publicUrl || ''}
                        className="bg-gray-700 border-gray-600 text-gray-400"
                        placeholder="Auto-generated after save"
                        readOnly
                      />
                      <Button type="button" variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Password Protection (Optional)</Label>
                    <Input
                      value={formData.sharing.password || ''}
                      onChange={(e) => handleNestedInputChange('sharing', 'password', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Optional password for access"
                      type="password"
                    />
                  </div>
                </div>
              )}

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Export History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                    <Download className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-gray-400">Export history will appear here after report generation</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Performance Alerts</CardTitle>
                  <CardDescription className="text-gray-400">
                    Get notified when metrics reach specific thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <Input
                      value={newAlert.metric}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, metric: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Metric name"
                    />
                    <Select 
                      value={newAlert.condition} 
                      onValueChange={(value: any) => setNewAlert(prev => ({ ...prev, condition: value }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="changes">Changes by</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={newAlert.threshold}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Threshold"
                    />
                    <Button
                      type="button"
                      onClick={addAlert}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Alert
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {formData.alerts.map((alert, index) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div>
                          <div className="text-white font-medium">
                            {alert.metric} {alert.condition} {alert.threshold}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {alert.recipients.length} recipients • {alert.enabled ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArrayRemove('alerts', '', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator className="bg-gray-700" />

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 text-white hover:bg-gray-800">
              Cancel
            </Button>
            <div className="space-x-2">
              <Button type="button" variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {report ? 'Update Report' : 'Create Report'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}