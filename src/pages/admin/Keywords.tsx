import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Filter, MoreHorizontal, TrendingUp, TrendingDown, Minus, Target, Users, DollarSign, BarChart3 } from 'lucide-react';
import { KeywordDialog } from '@/components/KeywordDialog';
import { Progress } from '@/components/ui/progress';

interface Keyword {
  id: string;
  keyword: string;
  category: string;
  targetUrl: string;
  currentRank?: number;
  previousRank?: number;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  competitors: string[];
  notes: string;
  isTracking: boolean;
  tags: string[];
  lastChecked?: string;
  rankHistory: Array<{
    date: string;
    rank: number;
    searchVolume?: number;
  }>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function Keywords() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | undefined>();
  const [deleteKeyword, setDeleteKeyword] = useState<Keyword | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:7071/api/getKeywords');
      if (response.ok) {
        const data = await response.json();
        setKeywords(data.data || []);
      } else {
        console.error('Failed to fetch keywords');
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKeyword = async (keywordData: Omit<Keyword, 'id'>) => {
    try {
      const response = await fetch('http://localhost:7071/api/createKeyword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keywordData),
      });

      if (response.ok) {
        await fetchKeywords();
        setIsDialogOpen(false);
      } else {
        console.error('Failed to create keyword');
      }
    } catch (error) {
      console.error('Error creating keyword:', error);
    }
  };

  const handleUpdateKeyword = async (keywordData: Omit<Keyword, 'id'>) => {
    if (!editingKeyword) return;

    try {
      const response = await fetch(`http://localhost:7071/api/updateKeyword/${editingKeyword.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keywordData),
      });

      if (response.ok) {
        await fetchKeywords();
        setIsDialogOpen(false);
        setEditingKeyword(undefined);
      } else {
        console.error('Failed to update keyword');
      }
    } catch (error) {
      console.error('Error updating keyword:', error);
    }
  };

  const handleDeleteKeyword = async () => {
    if (!deleteKeyword) return;

    try {
      const response = await fetch(`http://localhost:7071/api/deleteKeyword/${deleteKeyword.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchKeywords();
        setDeleteKeyword(undefined);
      } else {
        console.error('Failed to delete keyword');
      }
    } catch (error) {
      console.error('Error deleting keyword:', error);
    }
  };

  const filteredKeywords = keywords.filter(keyword => {
    const matchesSearch = keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         keyword.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         keyword.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterCategory === 'all' || keyword.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    {
      title: "Total Keywords",
      value: keywords.length.toString(),
      description: "Tracked",
      icon: Target,
      trend: keywords.filter(k => new Date(k.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length > 0 ? "+" + keywords.filter(k => new Date(k.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length : "0"
    },
    {
      title: "Active Tracking",
      value: keywords.filter(k => k.isTracking).length.toString(),
      description: "Monitored",
      icon: BarChart3,
      trend: "+" + keywords.filter(k => k.isTracking && new Date(k.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    },
    {
      title: "Avg. Difficulty",
      value: keywords.length > 0 ? Math.round(keywords.reduce((sum, k) => sum + k.difficulty, 0) / keywords.length).toString() : "0",
      description: "Out of 100",
      icon: TrendingUp,
      trend: keywords.length > 0 ? Math.round(keywords.reduce((sum, k) => sum + k.difficulty, 0) / keywords.length) > 50 ? "High" : "Medium" : "N/A"
    },
    {
      title: "Total Volume",
      value: keywords.reduce((sum, k) => sum + k.searchVolume, 0).toLocaleString(),
      description: "Monthly searches",
      icon: Users,
      trend: "+" + Math.floor(Math.random() * 10000)
    }
  ];

  const getRankTrend = (currentRank?: number, previousRank?: number) => {
    if (!currentRank || !previousRank) return null;
    
    if (currentRank < previousRank) {
      return { icon: TrendingUp, color: 'text-green-600', text: '↑' };
    } else if (currentRank > previousRank) {
      return { icon: TrendingDown, color: 'text-red-600', text: '↓' };
    } else {
      return { icon: Minus, color: 'text-gray-600', text: '−' };
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 80) return 'text-red-600 bg-red-100';
    if (difficulty >= 60) return 'text-yellow-600 bg-yellow-100';
    if (difficulty >= 40) return 'text-blue-600 bg-blue-100';
    return 'text-green-600 bg-green-100';
  };

  const getIntentColor = (intent: string) => {
    const colors = {
      'informational': 'bg-blue-100 text-blue-800',
      'commercial': 'bg-yellow-100 text-yellow-800',
      'transactional': 'bg-green-100 text-green-800',
      'navigational': 'bg-purple-100 text-purple-800'
    };
    return colors[intent as keyof typeof colors] || colors.informational;
  };

  const categories = ['Primary Keywords', 'Long-tail Keywords', 'Brand Keywords', 'Competitor Keywords', 'Local SEO', 'Product Keywords', 'Content Keywords', 'Seasonal Keywords'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Keywords</h1>
          <p className="text-gray-400">Track keyword rankings and analyze SEO performance</p>
        </div>
        <Button 
          onClick={() => {
            setEditingKeyword(undefined);
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Keyword
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
                    <Icon className="h-8 w-8 text-blue-400" />
                    <span className="text-xs text-green-400 font-medium">{stat.trend}</span>
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
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search keywords..."
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
                    Category: {filterCategory === 'all' ? 'All' : filterCategory}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700">
                  <DropdownMenuItem onClick={() => setFilterCategory('all')} className="text-white hover:bg-gray-700">All Categories</DropdownMenuItem>
                  {categories.map(category => (
                    <DropdownMenuItem key={category} onClick={() => setFilterCategory(category)} className="text-white hover:bg-gray-700">
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Keyword Rankings</CardTitle>
          <CardDescription className="text-gray-400">
            Monitor keyword performance and track ranking changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <p className="mt-2 text-gray-400">Loading keywords...</p>
            </div>
          ) : filteredKeywords.length > 0 ? (
            <div className="rounded-md border border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-750 border-gray-700">
                    <TableHead className="text-gray-300">Keyword</TableHead>
                    <TableHead className="text-gray-300">Current Rank</TableHead>
                    <TableHead className="text-gray-300">Volume</TableHead>
                    <TableHead className="text-gray-300">Difficulty</TableHead>
                    <TableHead className="text-gray-300">Intent</TableHead>
                    <TableHead className="text-gray-300">CPC</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeywords.map((keyword) => {
                    const trend = getRankTrend(keyword.currentRank, keyword.previousRank);
                    return (
                      <TableRow key={keyword.id} className="hover:bg-gray-750 border-gray-700">
                        <TableCell>
                          <div className="space-y-2">
                            <div className="font-medium text-white">{keyword.keyword}</div>
                            <div className="text-sm text-gray-400">{keyword.category}</div>
                            {keyword.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {keyword.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                                    {tag}
                                  </Badge>
                                ))}
                                {keyword.tags.length > 2 && (
                                  <span className="text-xs text-gray-500">+{keyword.tags.length - 2} more</span>
                                )}
                              </div>
                            )}
                            {!keyword.isTracking && (
                              <Badge variant="secondary" className="bg-red-700 text-red-200 text-xs">
                                Tracking Paused
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {keyword.currentRank ? (
                              <>
                                <span className="text-lg font-semibold text-white">#{keyword.currentRank}</span>
                                {trend && (
                                  <div className={`flex items-center ${trend.color}`}>
                                    <span className="text-sm font-medium">{trend.text}</span>
                                    {keyword.previousRank && (
                                      <span className="text-xs ml-1">
                                        ({Math.abs(keyword.currentRank - keyword.previousRank)})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-500">Not ranked</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-white">{keyword.searchVolume.toLocaleString()}</div>
                            <div className="text-gray-500">monthly searches</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                              {keyword.difficulty}/100
                            </div>
                            <Progress value={keyword.difficulty} className="h-1 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getIntentColor(keyword.intent)} border text-xs`}>
                            {keyword.intent}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <DollarSign className="w-3 h-3 text-green-400 mr-1" />
                            <span className="text-white">{keyword.cpc.toFixed(2)}</span>
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
                                  setEditingKeyword(keyword);
                                  setIsDialogOpen(true);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteKeyword(keyword)}>
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-white">
                {searchTerm || filterCategory !== 'all' ? 'No keywords found' : 'No keywords yet'}
              </h3>
              <p className="mt-2 text-gray-400">
                {searchTerm || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Start tracking your SEO keywords and monitor rankings.'}
              </p>
              {!searchTerm && filterCategory === 'all' && (
                <Button 
                  onClick={() => {
                    setEditingKeyword(undefined);
                    setIsDialogOpen(true);
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Keyword
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyword Dialog */}
      <KeywordDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingKeyword(undefined);
        }}
        onSave={editingKeyword ? handleUpdateKeyword : handleCreateKeyword}
        keyword={editingKeyword}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteKeyword} onOpenChange={() => setDeleteKeyword(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Keyword</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteKeyword?.keyword}"? This action cannot be undone and you will lose all ranking history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKeyword} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
