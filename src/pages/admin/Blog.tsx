import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BlogDialog } from '@/components/BlogDialog';
import { Plus, Edit, Trash2, Eye, Calendar, User, Tag, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    email: string;
    bio: string;
    avatar: string;
  };
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishDate?: Date;
  lastModified: Date;
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl: string;
    noIndex: boolean;
  };
  featured: {
    isFeatured: boolean;
    image: string;
    imageAlt: string;
    imageCaption: string;
  };
  engagement: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    avgReadTime: number;
  };
  settings: {
    allowComments: boolean;
    showAuthor: boolean;
    showSocialShare: boolean;
    showRelatedPosts: boolean;
    showToc: boolean;
  };
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // For development, start with sample data
      const samplePosts: BlogPost[] = [
        {
          id: '1',
          title: 'Ultimate Guide to Digital Marketing Success',
          slug: 'ultimate-guide-digital-marketing-success',
          excerpt: 'Discover proven strategies to boost your online presence and drive meaningful results for your business.',
          content: `# Introduction\n\nIn today's digital landscape, businesses face unprecedented challenges and opportunities...`,
          author: {
            name: 'John Doe',
            email: 'john@creedava.com',
            bio: 'Content creator and marketing specialist',
            avatar: ''
          },
          category: 'Marketing',
          tags: ['Digital Marketing', 'Strategy', 'Growth'],
          status: 'published',
          publishDate: new Date('2024-01-15'),
          lastModified: new Date('2024-01-16'),
          seo: {
            metaTitle: 'Ultimate Guide to Digital Marketing Success | CreedaVA',
            metaDescription: 'Discover proven strategies to boost your online presence and drive meaningful results for your business.',
            keywords: ['digital marketing', 'online presence', 'business growth'],
            canonicalUrl: 'https://creedava.com/blog/ultimate-guide-digital-marketing-success',
            noIndex: false
          },
          featured: {
            isFeatured: true,
            image: '/images/digital-marketing-guide.jpg',
            imageAlt: 'Digital marketing strategy illustration',
            imageCaption: 'Comprehensive digital marketing strategies for modern businesses'
          },
          engagement: {
            views: 2847,
            likes: 152,
            shares: 78,
            comments: 24,
            avgReadTime: 8
          },
          settings: {
            allowComments: true,
            showAuthor: true,
            showSocialShare: true,
            showRelatedPosts: true,
            showToc: true
          },
          userId: 'current-user',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-16T15:30:00Z'
        },
        {
          id: '2',
          title: 'Best Practices for SEO Optimization',
          slug: 'best-practices-seo-optimization',
          excerpt: 'Learn essential SEO techniques that will help your website rank higher in search engine results.',
          content: `# SEO Best Practices\n\nSearch engine optimization is crucial for online visibility...`,
          author: {
            name: 'Jane Smith',
            email: 'jane@creedava.com',
            bio: 'SEO specialist and content strategist',
            avatar: ''
          },
          category: 'SEO',
          tags: ['SEO', 'Optimization', 'Search Rankings'],
          status: 'draft',
          lastModified: new Date('2024-01-20'),
          seo: {
            metaTitle: 'Best Practices for SEO Optimization | CreedaVA',
            metaDescription: 'Learn essential SEO techniques that will help your website rank higher in search engine results.',
            keywords: ['SEO', 'search engine optimization', 'ranking'],
            canonicalUrl: 'https://creedava.com/blog/best-practices-seo-optimization',
            noIndex: false
          },
          featured: {
            isFeatured: false,
            image: '/images/seo-optimization.jpg',
            imageAlt: 'SEO optimization concept',
            imageCaption: 'Modern SEO strategies for better search rankings'
          },
          engagement: {
            views: 1203,
            likes: 89,
            shares: 45,
            comments: 12,
            avgReadTime: 6
          },
          settings: {
            allowComments: true,
            showAuthor: true,
            showSocialShare: true,
            showRelatedPosts: true,
            showToc: false
          },
          userId: 'current-user',
          createdAt: '2024-01-20T09:00:00Z',
          updatedAt: '2024-01-20T14:20:00Z'
        },
        {
          id: '3',
          title: 'Social Media Marketing Trends 2024',
          slug: 'social-media-marketing-trends-2024',
          excerpt: 'Explore the latest social media trends that are shaping the marketing landscape in 2024.',
          content: `# Social Media Trends 2024\n\nThe social media landscape continues to evolve rapidly...`,
          author: {
            name: 'Mike Johnson',
            email: 'mike@creedava.com',
            bio: 'Social media strategist and content creator',
            avatar: ''
          },
          category: 'Social Media',
          tags: ['Social Media', 'Trends', '2024', 'Marketing'],
          status: 'scheduled',
          publishDate: new Date('2024-02-01'),
          lastModified: new Date('2024-01-25'),
          seo: {
            metaTitle: 'Social Media Marketing Trends 2024 | CreedaVA',
            metaDescription: 'Explore the latest social media trends that are shaping the marketing landscape in 2024.',
            keywords: ['social media', 'marketing trends', '2024'],
            canonicalUrl: 'https://creedava.com/blog/social-media-marketing-trends-2024',
            noIndex: false
          },
          featured: {
            isFeatured: true,
            image: '/images/social-media-trends.jpg',
            imageAlt: 'Social media trends visualization',
            imageCaption: 'Emerging social media trends for 2024'
          },
          engagement: {
            views: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            avgReadTime: 7
          },
          settings: {
            allowComments: true,
            showAuthor: true,
            showSocialShare: true,
            showRelatedPosts: true,
            showToc: true
          },
          userId: 'current-user',
          createdAt: '2024-01-25T11:00:00Z',
          updatedAt: '2024-01-25T16:45:00Z'
        }
      ];

      // In a real app, fetch from API
      // const response = await fetch('/api/blog-posts');
      // const data = await response.json();
      
      setPosts(samplePosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (postData: Omit<BlogPost, 'id'>) => {
    try {
      if (selectedPost) {
        // Update existing post
        const updatedPost = { ...selectedPost, ...postData };
        setPosts(prev => prev.map(post => post.id === selectedPost.id ? updatedPost : post));
        console.log('Updating post:', updatedPost);
        // await fetch(`/api/blog-posts/${selectedPost.id}`, { method: 'PUT', body: JSON.stringify(updatedPost) });
      } else {
        // Create new post
        const newPost = {
          id: `post-${Date.now()}`,
          ...postData
        };
        setPosts(prev => [newPost, ...prev]);
        console.log('Creating post:', newPost);
        // await fetch('/api/blog-posts', { method: 'POST', body: JSON.stringify(newPost) });
      }
      setIsDialogOpen(false);
      setSelectedPost(undefined);
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setIsDialogOpen(true);
  };

  const handleDelete = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      setPosts(prev => prev.filter(post => post.id !== postId));
      console.log('Deleting post:', postId);
      // await fetch(`/api/blog-posts/${postId}`, { method: 'DELETE' });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-700 text-white',
      draft: 'bg-gray-700 text-white', 
      scheduled: 'bg-blue-700 text-white',
      archived: 'bg-red-700 text-white'
    };
    return <Badge className={styles[status as keyof typeof styles]}>{status}</Badge>;
  };

  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;
  const draftPosts = posts.filter(p => p.status === 'draft').length;
  const totalViews = posts.reduce((sum, p) => sum + p.engagement.views, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-white">Blog Management</h1>
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-400">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Blog Management</h1>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-gray-400 text-sm">Total Posts</p>
                <p className="text-2xl font-semibold text-white">{totalPosts}</p>
              </div>
              <Tag className="ml-auto h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-gray-400 text-sm">Published</p>
                <p className="text-2xl font-semibold text-white">{publishedPosts}</p>
              </div>
              <Eye className="ml-auto h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-gray-400 text-sm">Drafts</p>
                <p className="text-2xl font-semibold text-white">{draftPosts}</p>
              </div>
              <Edit className="ml-auto h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-gray-400 text-sm">Total Views</p>
                <p className="text-2xl font-semibold text-white">{totalViews.toLocaleString()}</p>
              </div>
              <TrendingUp className="ml-auto h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Blog Posts</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your blog posts, content, and publishing schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-750">
                <TableHead className="text-gray-300">Title</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Category</TableHead>
                <TableHead className="text-gray-300">Author</TableHead>
                <TableHead className="text-gray-300">Views</TableHead>
                <TableHead className="text-gray-300">Last Modified</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id} className="border-gray-700 hover:bg-gray-750">
                  <TableCell className="text-white">
                    <div>
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-gray-400">{post.excerpt.substring(0, 60)}...</div>
                      {post.featured.isFeatured && (
                        <Badge className="mt-1 bg-yellow-700 text-white">Featured</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell className="text-gray-300">{post.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{post.author.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{post.engagement.views.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-300">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(post.lastModified), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(post)}
                        className="text-blue-400 hover:bg-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        className="text-green-400 hover:bg-green-900"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        className="text-red-400 hover:bg-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {posts.length === 0 && (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No blog posts</h3>
              <p className="text-gray-400 mb-4">Get started by creating your first blog post.</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <BlogDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedPost(undefined);
        }}
        onSave={handleSave}
        post={selectedPost}
      />
    </div>
  );
}