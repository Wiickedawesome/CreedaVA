import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Filter, MoreHorizontal, DollarSign, Target, Users, TrendingUp, Play, Pause, BarChart } from 'lucide-react';
import { AdCampaignDialog } from '@/components/AdCampaignDialog';
import { format } from 'date-fns';

interface AdCampaign {
  id: string;
  name: string;
  platform: string;
  type: string;
  objective: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'rejected';
  budget: {
    total: number;
    daily: number;
    spent: number;
    currency: string;
  };
  targeting: {
    demographics: {
      ageMin: number;
      ageMax: number;
      genders: string[];
      locations: string[];
    };
    interests: string[];
    behaviors: string[];
    keywords: string[];
  };
  creative: {
    headline: string;
    description: string;
    images: string[];
    videos: string[];
    callToAction: string;
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
    timezone: string;
    dayParting: {
      enabled: boolean;
      schedule: Array<{
        day: string;
        hours: { start: string; end: string; };
      }>;
    };
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    roas: number;
  };
  bidStrategy: string;
  maxBid?: number;
  isABTesting: boolean;
  abTestVariants?: Array<{
    name: string;
    headline: string;
    description: string;
    trafficSplit: number;
  }>;
  conversionTracking: {
    enabled: boolean;
    pixelId?: string;
    events: string[];
  };
  notes: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function AdCampaigns() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | undefined>();
  const [deleteCampaign, setDeleteCampaign] = useState<AdCampaign | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:7071/api/getAdCampaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.data || []);
      } else {
        console.error('Failed to fetch ad campaigns');
      }
    } catch (error) {
      console.error('Error fetching ad campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCampaign = async (campaignData: Omit<AdCampaign, 'id'>) => {
    try {
      const response = await fetch('http://localhost:7071/api/createAdCampaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (response.ok) {
        await fetchCampaigns();
        setIsDialogOpen(false);
      } else {
        console.error('Failed to create ad campaign');
      }
    } catch (error) {
      console.error('Error creating ad campaign:', error);
    }
  };

  const handleUpdateCampaign = async (campaignData: Omit<AdCampaign, 'id'>) => {
    if (!editingCampaign) return;

    try {
      const response = await fetch(`http://localhost:7071/api/updateAdCampaign/${editingCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (response.ok) {
        await fetchCampaigns();
        setIsDialogOpen(false);
        setEditingCampaign(undefined);
      } else {
        console.error('Failed to update ad campaign');
      }
    } catch (error) {
      console.error('Error updating ad campaign:', error);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!deleteCampaign) return;

    try {
      const response = await fetch(`http://localhost:7071/api/deleteAdCampaign/${deleteCampaign.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCampaigns();
        setDeleteCampaign(undefined);
      } else {
        console.error('Failed to delete ad campaign');
      }
    } catch (error) {
      console.error('Error deleting ad campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.objective.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    {
      title: "Total Campaigns",
      value: campaigns.length.toString(),
      description: "All campaigns",
      icon: Target,
      trend: campaigns.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length > 0 ? "+" + campaigns.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length : "0"
    },
    {
      title: "Active Campaigns",
      value: campaigns.filter(c => c.status === 'active').length.toString(),
      description: "Currently running",
      icon: Play,
      trend: "+" + campaigns.filter(c => c.status === 'active' && new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    },
    {
      title: "Total Spent",
      value: "$" + campaigns.reduce((sum, c) => sum + c.budget.spent, 0).toLocaleString(),
      description: "All time",
      icon: DollarSign,
      trend: "$" + Math.floor(Math.random() * 10000).toLocaleString()
    },
    {
      title: "Avg. ROAS",
      value: campaigns.length > 0 ? (campaigns.reduce((sum, c) => sum + c.performance.roas, 0) / campaigns.length).toFixed(2) + "x" : "0x",
      description: "Return on ad spend",
      icon: TrendingUp,
      trend: campaigns.length > 0 ? (campaigns.reduce((sum, c) => sum + c.performance.roas, 0) / campaigns.length) > 2 ? "Good" : "Fair" : "N/A"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      'draft': 'bg-gray-100 text-gray-800 border-gray-200',
      'active': 'bg-green-100 text-green-800 border-green-200',
      'paused': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'completed': 'bg-blue-100 text-blue-800 border-blue-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status as keyof typeof variants] || variants.draft;
  };

  const getPlatformIcon = (platform: string) => {
    // Using generic icons since we can't import brand icons
    return <Target className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Ad Campaigns</h1>
          <p className="text-gray-300">Manage your advertising campaigns across platforms</p>
        </div>
        <Button 
          onClick={() => {
            setEditingCampaign(undefined);
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
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
                  placeholder="Search campaigns..."
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
                  <DropdownMenuItem onClick={() => setFilterStatus('active')}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('paused')}>Paused</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('completed')}>Completed</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Campaign Performance</CardTitle>
          <CardDescription className="text-gray-400">
            Monitor your advertising campaigns and their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-400">Loading campaigns...</p>
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="rounded-md border border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-900">
                    <TableHead className="text-gray-300">Campaign</TableHead>
                    <TableHead className="text-gray-300">Platform</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Budget</TableHead>
                    <TableHead className="text-gray-300">Performance</TableHead>
                    <TableHead className="text-gray-300">ROAS</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="hover:bg-gray-700 border-gray-700">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-white">{campaign.name}</div>
                          <div className="text-sm text-gray-400">{campaign.objective} • {campaign.type}</div>
                          <div className="text-sm text-gray-500">
                            Started {format(new Date(campaign.schedule.startDate), 'MMM d, yyyy')}
                          </div>
                          {campaign.isABTesting && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                              A/B Testing
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(campaign.platform)}
                          <span className="text-gray-300 capitalize">{campaign.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(campaign.status)} border`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <div className="font-medium text-white">
                              ${campaign.budget.spent.toLocaleString()} / ${campaign.budget.total.toLocaleString()}
                            </div>
                            <div className="text-gray-400">
                              ${campaign.budget.daily}/day
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${(campaign.budget.spent / campaign.budget.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <BarChart className="w-3 h-3 text-blue-500" />
                              <span className="text-gray-300">{campaign.performance.impressions.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3 text-green-500" />
                              <span className="text-gray-300">{campaign.performance.clicks.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            CTR: {campaign.performance.ctr.toFixed(2)}% • CPC: ${campaign.performance.cpc.toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${campaign.performance.roas >= 2 ? 'text-green-600' : campaign.performance.roas >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {campaign.performance.roas.toFixed(2)}x
                          </div>
                          <div className="text-xs text-gray-500">
                            {campaign.performance.conversions} conversions
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
                                setEditingCampaign(campaign);
                                setIsDialogOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            {campaign.status === 'active' && (
                              <DropdownMenuItem>Pause</DropdownMenuItem>
                            )}
                            {campaign.status === 'paused' && (
                              <DropdownMenuItem>Resume</DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteCampaign(campaign)}>
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
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-white">
                {searchTerm || filterStatus !== 'all' ? 'No campaigns found' : 'No campaigns yet'}
              </h3>
              <p className="mt-2 text-gray-400">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Create your first advertising campaign to start driving traffic and conversions.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button 
                  onClick={() => {
                    setEditingCampaign(undefined);
                    setIsDialogOpen(true);
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Campaign
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Dialog */}
      <AdCampaignDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingCampaign(undefined);
        }}
        onSave={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
        campaign={editingCampaign}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCampaign} onOpenChange={() => setDeleteCampaign(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCampaign?.name}"? This action cannot be undone and you will lose all campaign data and performance history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCampaign} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
