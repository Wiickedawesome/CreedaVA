import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Calendar, TrendingUp, MoreHorizontal, Search, Filter, Facebook, Twitter, Instagram, Linkedin, Users, Eye, Heart, Share } from 'lucide-react';
import { SocialMediaDialog } from '@/components/SocialMediaDialog';
import { format } from 'date-fns';

interface SocialMediaPost {
  id: string;
  title: string;
  content: string;
  platform: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledDate?: Date;
  publishedDate?: Date;
  hashtags: string[];
  images: string[];
  engagementMetrics: {
    likes: number;
    shares: number;
    comments: number;
    reach: number;
  };
  isAiGenerated: boolean;
  aiPrompt?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function Social() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | undefined>();
  const [deletePost, setDeletePost] = useState<SocialMediaPost | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:7071/api/getSocialMedia');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.data || []);
      } else {
        console.error('Failed to fetch social media posts');
      }
    } catch (error) {
      console.error('Error fetching social media posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (postData: Omit<SocialMediaPost, 'id'>) => {
    try {
      const response = await fetch('http://localhost:7071/api/createSocialMedia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        await fetchPosts();
        setIsDialogOpen(false);
      } else {
        console.error('Failed to create social media post');
      }
    } catch (error) {
      console.error('Error creating social media post:', error);
    }
  };

  const handleUpdatePost = async (postData: Omit<SocialMediaPost, 'id'>) => {
    if (!editingPost) return;

    try {
      const response = await fetch(`http://localhost:7071/api/updateSocialMedia/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        await fetchPosts();
        setIsDialogOpen(false);
        setEditingPost(undefined);
      } else {
        console.error('Failed to update social media post');
      }
    } catch (error) {
      console.error('Error updating social media post:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!deletePost) return;

    try {
      const response = await fetch(`http://localhost:7071/api/deleteSocialMedia/${deletePost.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPosts();
        setDeletePost(undefined);
      } else {
        console.error('Failed to delete social media post');
      }
    } catch (error) {
      console.error('Error deleting social media post:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.platform.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    {
      title: "Total Posts",
      value: posts.length.toString(),
      description: "All time",
      icon: Calendar,
      trend: posts.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length > 0 ? "+" + posts.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length : "0"
    },
    {
      title: "Published",
      value: posts.filter(p => p.status === 'published').length.toString(),
      description: "Live posts",
      icon: TrendingUp,
      trend: "+" + posts.filter(p => p.status === 'published' && new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    },
    {
      title: "Scheduled",
      value: posts.filter(p => p.status === 'scheduled').length.toString(),
      description: "Upcoming posts",
      icon: Calendar,
      trend: posts.filter(p => p.status === 'scheduled').length > 0 ? "+" + posts.filter(p => p.status === 'scheduled').length : "0"
    },
    {
      title: "Total Engagement",
      value: posts.reduce((sum, p) => sum + p.engagementMetrics.likes + p.engagementMetrics.comments + p.engagementMetrics.shares, 0).toString(),
      description: "All platforms",
      icon: Users,
      trend: "+" + Math.floor(Math.random() * 1000)
    }
  ];

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'bg-gray-800 text-gray-300 border-gray-700',
      scheduled: 'bg-blue-900/40 text-blue-300 border-blue-700',
      published: 'bg-green-900/40 text-green-300 border-green-700',
      failed: 'bg-red-900/40 text-red-300 border-red-700'
    } as const;
    return variants[status as keyof typeof variants] || variants.draft;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Social Media</h1>
          <p className="text-gray-400">Manage your social media campaigns and content</p>
        </div>
        <Button 
          onClick={() => {
            setEditingPost(undefined);
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Post
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
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
                    <Filter className="mr-2 h-4 w-4" />
                    Status: {filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus('all')}>All Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('draft')}>Draft</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('scheduled')}>Scheduled</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('published')}>Published</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('failed')}>Failed</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Social Media Posts</CardTitle>
          <CardDescription className="text-gray-400">
            Manage all your social media content across platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <p className="mt-2 text-gray-400">Loading posts...</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="rounded-md border border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-750 border-gray-700">
                    <TableHead className="text-gray-300">Post</TableHead>
                    <TableHead className="text-gray-300">Platform</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Engagement</TableHead>
                    <TableHead className="text-gray-300">Scheduled/Published</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id} className="hover:bg-gray-750 border-gray-700">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-white">{post.title}</div>
                          <div className="text-sm text-gray-400 line-clamp-2">
                            {post.content.substring(0, 100)}...
                          </div>
                          {post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {post.hashtags.slice(0, 3).map((hashtag, index) => (
                                <span key={index} className="text-xs bg-blue-700 text-blue-200 px-2 py-1 rounded">
                                  #{hashtag}
                                </span>
                              ))}
                              {post.hashtags.length > 3 && (
                                <span className="text-xs text-gray-500">+{post.hashtags.length - 3} more</span>
                              )}
                            </div>
                          )}
                          {post.isAiGenerated && (
                            <Badge variant="secondary" className="bg-purple-700 text-purple-200 text-xs">
                              AI Generated
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(post.platform)}
                          <span className="text-gray-300 capitalize">{post.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadge(post.status)} border`}>
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3 text-sm">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-3 h-3 text-red-500" />
                              <span className="text-gray-600">{post.engagementMetrics.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Share className="w-3 h-3 text-blue-500" />
                              <span className="text-gray-600">{post.engagementMetrics.shares}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3 text-green-500" />
                              <span className="text-gray-600">{post.engagementMetrics.reach}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {post.status === 'scheduled' && post.scheduledDate && (
                            <div>
                              <div className="font-medium text-blue-600">Scheduled</div>
                              <div>{format(new Date(post.scheduledDate), 'MMM d, yyyy h:mm a')}</div>
                            </div>
                          )}
                          {post.status === 'published' && post.publishedDate && (
                            <div>
                              <div className="font-medium text-green-600">Published</div>
                              <div>{format(new Date(post.publishedDate), 'MMM d, yyyy h:mm a')}</div>
                            </div>
                          )}
                          {post.status === 'draft' && (
                            <div>
                              <div className="font-medium text-gray-600">Draft</div>
                              <div>Created {format(new Date(post.createdAt), 'MMM d, yyyy')}</div>
                            </div>
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
                                setEditingPost(post);
                                setIsDialogOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletePost(post)}>
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
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-white">
                {searchTerm || filterStatus !== 'all' ? 'No posts found' : 'No posts yet'}
              </h3>
              <p className="mt-2 text-gray-400">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Get started by creating your first social media post.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button 
                  onClick={() => {
                    setEditingPost(undefined);
                    setIsDialogOpen(true);
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Post
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Media Dialog */}
      <SocialMediaDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPost(undefined);
        }}
        onSave={editingPost ? handleUpdatePost : handleCreatePost}
        post={editingPost}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletePost?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}