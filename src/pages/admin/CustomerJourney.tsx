import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Filter, MoreHorizontal, Users, MapPin, Target, TrendingUp, Clock, Star } from 'lucide-react';
import { CustomerJourneyDialog } from '@/components/CustomerJourneyDialog';
import { format } from 'date-fns';
import { API_BASE, authorizedFetch } from '@/lib/api-client';
import { ErrorPanel } from '@/components/ErrorPanel'
import { useAuth } from '@/contexts/AuthContext'

interface CustomerJourney {
  id: string;
  name: string;
  description: string;
  persona: {
    name: string;
    description: string;
    demographics: {
      age: string;
      location: string;
      occupation: string;
      income: string;
    };
    goals: string[];
    painPoints: string[];
  };
  stages: Array<{
    id: string;
    name: string;
    description: string;
    order: number;
    touchpoints: Array<{
      id: string;
      name: string;
      type: 'website' | 'email' | 'social' | 'phone' | 'inperson' | 'app' | 'advertisement';
      description: string;
      emotions: string[];
      actions: string[];
      painPoints: string[];
      opportunities: string[];
    }>;
    metrics: {
      conversionRate: number;
      dropOffRate: number;
      avgTimeSpent: number;
      satisfaction: number;
    };
  }>;
  funnel: {
    awareness: number;
    consideration: number;
    decision: number;
    retention: number;
    advocacy: number;
  };
  analytics: {
    totalUsers: number;
    completionRate: number;
    avgJourneyTime: number;
    topExitPoints: Array<{
      stage: string;
      percentage: number;
    }>;
  };
  optimizations: Array<{
    stage: string;
    issue: string;
    solution: string;
    priority: 'low' | 'medium' | 'high';
    status: 'identified' | 'planned' | 'inprogress' | 'completed';
  }>;
  status: 'draft' | 'active' | 'archived';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function CustomerJourney() {
  const [journeys, setJourneys] = useState<CustomerJourney[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJourney, setEditingJourney] = useState<CustomerJourney | undefined>();
  const [deleteJourney, setDeleteJourney] = useState<CustomerJourney | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const { signIn } = useAuth();

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setErrorStatus(null);
      const response = await authorizedFetch(`${API_BASE}/getCustomerJourneys`);
      if (response.ok) {
        const data = await response.json();
        setJourneys(data.data || []);
      } else {
        setError('Failed to fetch customer journeys');
        setErrorStatus(response.status || null);
        console.error('Failed to fetch customer journeys', response.status);
      }
    } catch (err) {
      console.error('Error fetching customer journeys:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customer journeys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJourney = async (journeyData: Omit<CustomerJourney, 'id'>) => {
    try {
      const response = await authorizedFetch(`${API_BASE}/createCustomerJourneys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(journeyData),
      });

      if (response.ok) {
        await fetchJourneys();
        setIsDialogOpen(false);
      } else {
        console.error('Failed to create customer journey');
      }
    } catch (error) {
      console.error('Error creating customer journey:', error);
    }
  };

  const handleUpdateJourney = async (journeyData: Omit<CustomerJourney, 'id'>) => {
    if (!editingJourney) return;

    try {
      const response = await authorizedFetch(`${API_BASE}/updateCustomerJourneys/${editingJourney.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(journeyData),
      });

      if (response.ok) {
        await fetchJourneys();
        setIsDialogOpen(false);
        setEditingJourney(undefined);
      } else {
        console.error('Failed to update customer journey');
      }
    } catch (error) {
      console.error('Error updating customer journey:', error);
    }
  };

  const handleDeleteJourney = async () => {
    if (!deleteJourney) return;

    try {
      const response = await authorizedFetch(`${API_BASE}/deleteCustomerJourneys/${deleteJourney.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchJourneys();
        setDeleteJourney(undefined);
      } else {
        console.error('Failed to delete customer journey');
      }
    } catch (error) {
      console.error('Error deleting customer journey:', error);
    }
  };

  const filteredJourneys = journeys.filter(journey => {
    const matchesSearch = journey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         journey.persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         journey.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || journey.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    {
      title: "Total Journeys",
      value: journeys.length.toString(),
      description: "Customer journeys",
      icon: MapPin,
      trend: journeys.filter(j => new Date(j.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length > 0 ? "+" + journeys.filter(j => new Date(j.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length : "0"
    },
    {
      title: "Active Journeys",
      value: journeys.filter(j => j.status === 'active').length.toString(),
      description: "Currently mapped",
      icon: Target,
      trend: "+" + journeys.filter(j => j.status === 'active' && new Date(j.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    },
    {
      title: "Avg Completion",
      value: journeys.length > 0 ? (journeys.reduce((sum, j) => sum + j.analytics.completionRate, 0) / journeys.length).toFixed(1) + "%" : "0%",
      description: "Journey completion",
      icon: TrendingUp,
      trend: journeys.length > 0 ? (journeys.reduce((sum, j) => sum + j.analytics.completionRate, 0) / journeys.length) > 60 ? "Good" : "Needs work" : "N/A"
    },
    {
      title: "Total Touchpoints",
      value: journeys.reduce((sum, j) => sum + j.stages.reduce((stageSum, s) => stageSum + s.touchpoints.length, 0), 0).toString(),
      description: "Mapped touchpoints",
      icon: Users,
      trend: Math.floor(Math.random() * 20).toString()
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      'draft': 'bg-gray-100 text-gray-800 border-gray-200',
      'active': 'bg-green-100 text-green-800 border-green-200',
      'archived': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return variants[status as keyof typeof variants] || variants.draft;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Customer Journey</h1>
          <p className="text-gray-300">Map customer touchpoints and optimize conversion paths</p>
        </div>
        <Button 
          onClick={() => {
            setEditingJourney(undefined);
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Journey
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
                  placeholder="Search customer journeys..."
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
                  <DropdownMenuItem onClick={() => setFilterStatus('archived')}>Archived</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journeys Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Customer Journey Maps</CardTitle>
          <CardDescription className="text-gray-400">
            Analyze customer touchpoints and optimize conversion paths
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-400">Loading journeys...</p>
            </div>
          ) : error ? (
            <ErrorPanel message={error} onRetry={fetchJourneys} onSignIn={errorStatus === 401 ? async () => { await signIn(); fetchJourneys(); } : undefined} />
          ) : filteredJourneys.length > 0 ? (
            <div className="rounded-md border border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-900">
                    <TableHead className="text-gray-300">Journey</TableHead>
                    <TableHead className="text-gray-300">Persona</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Stages</TableHead>
                    <TableHead className="text-gray-300">Conversion Funnel</TableHead>
                    <TableHead className="text-gray-300">Performance</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJourneys.map((journey) => (
                    <TableRow key={journey.id} className="hover:bg-gray-700 border-gray-700">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-white">{journey.name}</div>
                          <div className="text-sm text-gray-400">{journey.description}</div>
                          <div className="text-sm text-gray-500">
                            Created {format(new Date(journey.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-white">{journey.persona.name}</div>
                          <div className="text-sm text-gray-400">{journey.persona.demographics.occupation}</div>
                          <div className="text-sm text-gray-500">{journey.persona.demographics.age}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(journey.status)} border`}>
                          {journey.status.charAt(0).toUpperCase() + journey.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-white font-medium">{journey.stages.length} stages</div>
                          <div className="text-sm text-gray-400">
                            {journey.stages.reduce((sum, s) => sum + s.touchpoints.length, 0)} touchpoints
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Awareness</span>
                              <span className="text-white">{journey.funnel.awareness}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-1">
                              <div 
                                className="bg-blue-500 h-1 rounded-full" 
                                style={{ width: `${journey.funnel.awareness}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Decision</span>
                              <span className="text-white">{journey.funnel.decision}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-1">
                              <div 
                                className="bg-green-500 h-1 rounded-full" 
                                style={{ width: `${journey.funnel.decision}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-center">
                            <div className={`text-lg font-semibold ${journey.analytics.completionRate >= 60 ? 'text-green-600' : journey.analytics.completionRate >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {journey.analytics.completionRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Completion Rate</div>
                          </div>
                          <div className="text-xs text-gray-400 text-center">
                            {journey.analytics.totalUsers.toLocaleString()} users
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
                                setEditingJourney(journey);
                                setIsDialogOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MapPin className="w-4 h-4 mr-2" />
                              View Map
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Target className="w-4 h-4 mr-2" />
                              Analyze
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteJourney(journey)}>
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
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-white">
                {searchTerm || filterStatus !== 'all' ? 'No journeys found' : 'No customer journeys yet'}
              </h3>
              <p className="mt-2 text-gray-400">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Create your first customer journey to start mapping touchpoints and optimizing conversions.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button 
                  onClick={() => {
                    setEditingJourney(undefined);
                    setIsDialogOpen(true);
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Journey
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journey Dialog */}
      <CustomerJourneyDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingJourney(undefined);
        }}
        onSave={editingJourney ? handleUpdateJourney : handleCreateJourney}
        journey={editingJourney}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteJourney} onOpenChange={() => setDeleteJourney(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer Journey</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteJourney?.name}"? This action cannot be undone and you will lose all journey mapping and analytics data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJourney} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
