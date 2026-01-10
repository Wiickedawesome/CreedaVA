import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Filter, MoreHorizontal, Globe, Eye, BarChart, Users, Zap, Target, Code, Palette, TrendingUp } from 'lucide-react';
import { LandingPagesDialog } from '@/components/LandingPagesDialog';
import { format } from 'date-fns';

interface LandingPage {
  id: string;
  name: string;
  title: string;
  description: string;
  url: string;
  slug: string;
  template: string;
  status: 'draft' | 'published' | 'archived' | 'testing';
  content: {
    sections: Array<{
      id: string;
      type: 'hero' | 'features' | 'testimonials' | 'pricing' | 'cta' | 'form' | 'content';
      title: string;
      content: string;
      order: number;
      settings: Record<string, any>;
    }>;
    theme: {
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      backgroundColor: string;
    };
    customCSS: string;
    customJS: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage: string;
    canonicalUrl: string;
    noIndex: boolean;
  };
  tracking: {
    googleAnalytics: string;
    facebookPixel: string;
    customTracking: Array<{
      name: string;
      code: string;
      position: 'head' | 'body';
    }>;
  };
  abTesting: {
    enabled: boolean;
    variants: Array<{
      name: string;
      traffic: number;
      changes: Record<string, any>;
    }>;
    goal: 'conversions' | 'clicks' | 'time' | 'scroll';
    winnerCriteria: number;
  };
  performance: {
    views: number;
    uniqueViews: number;
    conversions: number;
    conversionRate: number;
    avgTimeOnPage: number;
    bounceRate: number;
    topSources: Array<{
      source: string;
      visitors: number;
      conversions: number;
    }>;
  };
  forms: Array<{
    id: string;
    name: string;
    fields: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      validation: string;
    }>;
    action: string;
    redirect: string;
  }>;
  integrations: {
    crmConnected: boolean;
    emailMarketing: string;
    webHooks: string[];
  };
  publishedAt?: Date;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function LandingPages() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | undefined>();
  const [deletePage, setDeletePage] = useState<LandingPage | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:7071/api/getLandingPages');
      if (response.ok) {
        const data = await response.json();
        setPages(data.data || []);
      } else {
        console.error('Failed to fetch landing pages');
      }
    } catch (error) {
      console.error('Error fetching landing pages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePage = async (pageData: Omit<LandingPage, 'id'>) => {
    try {
      const response = await fetch('http://localhost:7071/api/createLandingPage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });

      if (response.ok) {
        await fetchPages();
        setIsDialogOpen(false);
      } else {
        console.error('Failed to create landing page');
      }
    } catch (error) {
      console.error('Error creating landing page:', error);
    }
  };

  const handleUpdatePage = async (pageData: Omit<LandingPage, 'id'>) => {
    if (!editingPage) return;

    try {
      const response = await fetch(`http://localhost:7071/api/updateLandingPage/${editingPage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });

      if (response.ok) {
        await fetchPages();
        setIsDialogOpen(false);
        setEditingPage(undefined);
      } else {
        console.error('Failed to update landing page');
      }
    } catch (error) {
      console.error('Error updating landing page:', error);
    }
  };

  const handleDeletePage = async () => {
    if (!deletePage) return;

    try {
      const response = await fetch(`http://localhost:7071/api/deleteLandingPage/${deletePage.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPages();
        setDeletePage(undefined);
      } else {
        console.error('Failed to delete landing page');
      }
    } catch (error) {
      console.error('Error deleting landing page:', error);
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || page.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    {
      title: "Total Pages",
      value: pages.length.toString(),
      description: "All landing pages",
      icon: Globe,
      trend: pages.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length > 0 ? "+" + pages.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length : "0"
    },
    {
      title: "Published",
      value: pages.filter(p => p.status === 'published').length.toString(),
      description: "Live pages",
      icon: Eye,
      trend: "+" + pages.filter(p => p.status === 'published' && new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    },
    {
      title: "Total Views",
      value: pages.reduce((sum, p) => sum + p.performance.views, 0).toLocaleString(),
      description: "All time",
      icon: BarChart,
      trend: "+" + Math.floor(Math.random() * 10000).toLocaleString()
    },
    {
      title: "Avg. Conv. Rate",
      value: pages.length > 0 ? (pages.reduce((sum, p) => sum + p.performance.conversionRate, 0) / pages.length).toFixed(2) + "%" : "0%",
      description: "Conversion rate",
      icon: TrendingUp,
      trend: pages.length > 0 ? (pages.reduce((sum, p) => sum + p.performance.conversionRate, 0) / pages.length) > 5 ? "Good" : "Fair" : "N/A"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      'draft': 'bg-gray-100 text-gray-800 border-gray-200',
      'published': 'bg-green-100 text-green-800 border-green-200',
      'archived': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'testing': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return variants[status as keyof typeof variants] || variants.draft;
  };

  const getTemplateIcon = (template: string) => {
    const icons = {
      'modern': Code,
      'startup': Zap,
      'agency': Target,
      'ecommerce': BarChart,
      'leadgen': Users,
      'event': Globe,
      'portfolio': Eye,
      'webinar': Palette
    };
    const Icon = icons[template as keyof typeof icons] || Code;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Landing Pages</h1>
          <p className="text-gray-300">Create and manage high-converting landing pages</p>
        </div>
        <Button 
          onClick={() => {
            setEditingPage(undefined);
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Page
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
                  placeholder="Search pages..."
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
                    Status: {filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus('all')}>All Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('draft')}>Draft</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('published')}>Published</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('archived')}>Archived</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('testing')}>A/B Testing</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pages Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Landing Page Performance</CardTitle>
          <CardDescription className="text-gray-400">
            Monitor your landing page performance and conversion metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-400">Loading pages...</p>
            </div>
          ) : filteredPages.length > 0 ? (
            <div className="rounded-md border border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-900">
                    <TableHead className="text-gray-300">Page</TableHead>
                    <TableHead className="text-gray-300">Template</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Performance</TableHead>
                    <TableHead className="text-gray-300">Conv. Rate</TableHead>
                    <TableHead className="text-gray-300">A/B Testing</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => (
                    <TableRow key={page.id} className="hover:bg-gray-700 border-gray-700">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-white">{page.name}</div>
                          <div className="text-sm text-gray-400">{page.title}</div>
                          <div className="text-sm text-gray-500">
                            /{page.slug}
                          </div>
                          <div className="text-xs text-gray-500">
                            Created {format(new Date(page.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTemplateIcon(page.template)}
                          <span className="text-gray-300 capitalize">{page.template}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(page.status)} border`}>
                          {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3 text-blue-500" />
                              <span className="text-gray-300">{page.performance.views.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3 text-green-500" />
                              <span className="text-gray-300">{page.performance.uniqueViews.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Avg. Time: {Math.floor(page.performance.avgTimeOnPage / 60)}m {page.performance.avgTimeOnPage % 60}s
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${page.performance.conversionRate >= 5 ? 'text-green-600' : page.performance.conversionRate >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {page.performance.conversionRate.toFixed(2)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {page.performance.conversions} conversions
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          {page.abTesting.enabled ? (
                            <div>
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                {page.abTesting.variants.length} variants
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                Goal: {page.abTesting.goal}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Not testing</span>
                          )}
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
                                setEditingPage(page);
                                setIsDialogOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            {page.status === 'published' && (
                              <DropdownMenuItem>
                                <Globe className="w-4 h-4 mr-2" />
                                Visit Live
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeletePage(page)}>
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
              <Globe className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-white">
                {searchTerm || filterStatus !== 'all' ? 'No pages found' : 'No landing pages yet'}
              </h3>
              <p className="mt-2 text-gray-400">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Create your first landing page to start converting visitors into customers.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button 
                  onClick={() => {
                    setEditingPage(undefined);
                    setIsDialogOpen(true);
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Page
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Page Dialog */}
      <LandingPagesDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPage(undefined);
        }}
        onSave={editingPage ? handleUpdatePage : handleCreatePage}
        landingPage={editingPage}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePage} onOpenChange={() => setDeletePage(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Landing Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletePage?.name}"? This action cannot be undone and you will lose all page content and analytics data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePage} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
