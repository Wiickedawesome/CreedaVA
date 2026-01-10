import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Filter, MoreHorizontal, BarChart, LineChart, Calendar, Download, Mail, Share, Clock, Database, Eye, AlertTriangle } from 'lucide-react';
import { ReportsDialog } from '@/components/ReportsDialog';
import { format } from 'date-fns';

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

export function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | undefined>();
  const [deleteReport, setDeleteReport] = useState<Report | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:7071/api/getReports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
      } else {
        console.error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = async (reportData: Omit<Report, 'id'>) => {
    try {
      const response = await fetch('http://localhost:7071/api/createReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        await fetchReports();
        setIsDialogOpen(false);
      } else {
        console.error('Failed to create report');
      }
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const handleUpdateReport = async (reportData: Omit<Report, 'id'>) => {
    if (!editingReport) return;

    try {
      const response = await fetch(`http://localhost:7071/api/updateReport/${editingReport.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        await fetchReports();
        setIsDialogOpen(false);
        setEditingReport(undefined);
      } else {
        console.error('Failed to update report');
      }
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteReport) return;

    try {
      const response = await fetch(`http://localhost:7071/api/deleteReport/${deleteReport.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchReports();
        setDeleteReport(undefined);
      } else {
        console.error('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterCategory === 'all' || report.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    {
      title: "Total Reports",
      value: reports.length.toString(),
      description: "All reports",
      icon: BarChart,
      trend: reports.filter(r => new Date(r.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length > 0 ? "+" + reports.filter(r => new Date(r.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length : "0"
    },
    {
      title: "Active Reports",
      value: reports.filter(r => r.status === 'active').length.toString(),
      description: "Currently active",
      icon: Eye,
      trend: "+" + reports.filter(r => r.status === 'active' && new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    },
    {
      title: "Scheduled",
      value: reports.filter(r => r.schedule.enabled).length.toString(),
      description: "Automated reports",
      icon: Calendar,
      trend: Math.floor(Math.random() * 5).toString()
    },
    {
      title: "Avg Exec. Time",
      value: reports.length > 0 ? (reports.reduce((sum, r) => sum + r.metadata.executionTime, 0) / reports.length).toFixed(1) + "s" : "0s",
      description: "Generation time",
      icon: Clock,
      trend: reports.length > 0 ? (reports.reduce((sum, r) => sum + r.metadata.executionTime, 0) / reports.length) < 5 ? "Fast" : "Normal" : "N/A"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      'draft': 'bg-gray-100 text-gray-800 border-gray-200',
      'active': 'bg-green-100 text-green-800 border-green-200',
      'archived': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'error': 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status as keyof typeof variants] || variants.draft;
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      'analytics': 'bg-blue-100 text-blue-800',
      'sales': 'bg-green-100 text-green-800',
      'marketing': 'bg-purple-100 text-purple-800',
      'financial': 'bg-orange-100 text-orange-800',
      'custom': 'bg-gray-100 text-gray-800'
    };
    return variants[category as keyof typeof variants] || variants.custom;
  };

  const getDataSourceIcon = (type: string) => {
    const icons = {
      'analytics': BarChart,
      'crm': Database,
      'email': Mail,
      'social': Share,
      'ads': LineChart,
      'database': Database
    };
    const Icon = icons[type as keyof typeof icons] || Database;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Reports</h1>
          <p className="text-gray-300">Create and manage comprehensive analytics reports</p>
        </div>
        <Button 
          onClick={() => {
            setEditingReport(undefined);
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <Icon className="h-8 w-8 text-blue-600" />
                    <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filter */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                    <Filter className="mr-2 h-4 w-4" />
                    Category: {filterCategory === 'all' ? 'All' : filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterCategory('all')}>All Categories</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory('analytics')}>Analytics</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory('sales')}>Sales</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory('marketing')}>Marketing</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory('financial')}>Financial</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory('custom')}>Custom</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Report Management</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your analytics reports, schedules, and data visualizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-400">Loading reports...</p>
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="rounded-md border border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-900">
                    <TableHead className="text-gray-300">Report</TableHead>
                    <TableHead className="text-gray-300">Category</TableHead>
                    <TableHead className="text-gray-300">Data Source</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Schedule</TableHead>
                    <TableHead className="text-gray-300">Performance</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-gray-700 border-gray-700">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-white">{report.name}</div>
                          <div className="text-sm text-gray-400">{report.description}</div>
                          <div className="text-sm text-gray-500 capitalize">
                            {report.reportType} • {report.visualization.chartTypes.join(', ')}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {report.metadata.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {report.metadata.tags.length > 2 && (
                              <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                                +{report.metadata.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getCategoryBadge(report.category)}`}>
                          {report.category.charAt(0).toUpperCase() + report.category.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getDataSourceIcon(report.dataSource.type)}
                          <span className="text-gray-300 capitalize">{report.dataSource.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={`${getStatusBadge(report.status)} border`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </Badge>
                          {report.status === 'error' && (
                            <div className="flex items-center text-red-400 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Last run failed
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {report.schedule.enabled ? (
                            <div>
                              <div className="flex items-center text-green-400 text-sm">
                                <Calendar className="w-3 h-3 mr-1" />
                                {report.schedule.frequency}
                              </div>
                              <div className="text-xs text-gray-500">
                                {report.schedule.time} • {report.schedule.recipients.length} recipients
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Manual only</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="text-white">
                              {report.metadata.executionTime.toFixed(1)}s
                            </div>
                            <div className="text-gray-400">
                              {report.metadata.rowCount.toLocaleString()} rows
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {report.metadata.fileSize} • Last: {report.metadata.lastGenerated ? format(new Date(report.metadata.lastGenerated), 'MMM d') : 'Never'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setEditingReport(report);
                                setIsDialogOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Report
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Generate Now
                            </DropdownMenuItem>
                            {report.sharing.isPublic && (
                              <DropdownMenuItem>
                                <Share className="w-4 h-4 mr-2" />
                                Share Link
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteReport(report)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-white">
                {searchTerm || filterCategory !== 'all' ? 'No reports found' : 'No reports yet'}
              </h3>
              <p className="mt-2 text-gray-400">
                {searchTerm || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Create your first report to start analyzing your data with custom dashboards.'}
              </p>
              {!searchTerm && filterCategory === 'all' && (
                <Button 
                  onClick={() => {
                    setEditingReport(undefined);
                    setIsDialogOpen(true);
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Report
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <ReportsDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingReport(undefined);
        }}
        onSave={editingReport ? handleUpdateReport : handleCreateReport}
        report={editingReport}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReport} onOpenChange={() => setDeleteReport(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteReport?.name}"? This action cannot be undone and you will lose all report configurations and scheduled exports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
