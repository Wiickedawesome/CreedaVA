import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Plus, X, Calendar, Tag, Eye, FileText, Image, Link } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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

interface BlogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<BlogPost, 'id'>) => void;
  post?: BlogPost;
}

const blogCategories = [
  'Technology', 'Business', 'Marketing', 'Design', 'Development',
  'SEO', 'Analytics', 'Social Media', 'Content', 'Strategy', 'News', 'Tutorial'
];

export function BlogDialog({ isOpen, onClose, onSave, post }: BlogDialogProps) {
  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: {
      name: 'John Doe',
      email: 'john@creedava.com',
      bio: 'Content creator and marketing specialist',
      avatar: ''
    },
    category: 'Business',
    tags: [],
    status: 'draft',
    lastModified: new Date(),
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
      canonicalUrl: '',
      noIndex: false
    },
    featured: {
      isFeatured: false,
      image: '',
      imageAlt: '',
      imageCaption: ''
    },
    engagement: {
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      avgReadTime: 5
    },
    settings: {
      allowComments: true,
      showAuthor: true,
      showSocialShare: true,
      showRelatedPosts: true,
      showToc: false
    },
    userId: 'current-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [newTag, setNewTag] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [publishDate, setPublishDate] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (post) {
      setFormData(post);
      setPublishDate(post.publishDate);
    }
  }, [post]);

  useEffect(() => {
    const words = formData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    const readTime = Math.max(1, Math.ceil(words / 200)); // 200 words per minute
    setFormData(prev => ({
      ...prev,
      engagement: { ...prev.engagement, avgReadTime: readTime }
    }));
  }, [formData.content]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from title
    if (field === 'title' && !post) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleNestedInputChange = (category: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category as keyof typeof prev] as any, [field]: value }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.seo.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          keywords: [...prev.seo.keywords, newKeyword.trim()]
        }
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords.filter((_, i) => i !== index)
      }
    }));
  };

  const generateAIContent = (type: string) => {
    const suggestions = {
      title: [
        'Ultimate Guide to Digital Marketing Success',
        'Transform Your Business with Data-Driven Insights',
        'Best Practices for Modern Web Development',
        'How to Build a Winning Content Strategy'
      ],
      excerpt: [
        'Discover proven strategies to boost your online presence and drive meaningful results for your business.',
        'Learn essential techniques that industry leaders use to stay ahead of the competition.',
        'Explore actionable insights that can transform your approach to digital growth.'
      ],
      content: `# Introduction

In today's digital landscape, businesses face unprecedented challenges and opportunities. This comprehensive guide explores proven strategies that can help you navigate the complexities of modern marketing.

## Key Strategies

### 1. Data-Driven Decision Making
Understanding your audience through analytics is crucial for success. By leveraging data insights, you can:
- Identify target demographics
- Optimize campaign performance
- Improve customer experience

### 2. Content Excellence
Creating valuable content that resonates with your audience builds trust and authority:
- Focus on solving real problems
- Maintain consistent quality
- Engage across multiple channels

### 3. Technology Integration
Embracing the right tools can streamline operations and enhance productivity:
- Marketing automation platforms
- CRM systems
- Analytics tools

## Conclusion

Success in digital marketing requires a combination of strategy, execution, and continuous optimization. By implementing these proven techniques, businesses can achieve sustainable growth and lasting impact.`
    };
    
    return suggestions[type as keyof typeof suggestions];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      publishDate,
      lastModified: new Date(),
      updatedAt: new Date().toISOString(),
      seo: {
        ...formData.seo,
        metaTitle: formData.seo.metaTitle || formData.title,
        metaDescription: formData.seo.metaDescription || formData.excerpt
      }
    };
    onSave(dataToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {post ? 'Edit Blog Post' : 'Create New Blog Post'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {post ? 'Modify blog post content and settings.' : 'Create engaging content for your audience with SEO optimization.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-800">
              <TabsTrigger value="content" className="data-[state=active]:bg-gray-700">Content</TabsTrigger>
              <TabsTrigger value="seo" className="data-[state=active]:bg-gray-700">SEO</TabsTrigger>
              <TabsTrigger value="media" className="data-[state=active]:bg-gray-700">Media</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">Settings</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-white flex items-center gap-2">
                    Post Title
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const suggestion = generateAIContent('title');
                        if (Array.isArray(suggestion)) {
                          handleInputChange('title', suggestion[Math.floor(Math.random() * suggestion.length)]);
                        }
                      }}
                      className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      ✨ AI Suggest
                    </Button>
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Enter an engaging title"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">URL Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="url-friendly-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {blogCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  Excerpt
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const suggestion = generateAIContent('excerpt');
                      if (Array.isArray(suggestion)) {
                        handleInputChange('excerpt', suggestion[Math.floor(Math.random() * suggestion.length)]);
                      }
                    }}
                    className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    ✨ AI Suggest
                  </Button>
                </Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Brief description that appears in previews"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    Content
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInputChange('content', generateAIContent('content'))}
                      className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      ✨ Generate Sample
                    </Button>
                  </span>
                  <div className="text-xs text-gray-400">
                    {wordCount} words • {formData.engagement.avgReadTime} min read
                  </div>
                </Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white font-mono"
                  placeholder="Write your blog content in Markdown format..."
                  rows={15}
                />
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
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-700 text-white">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(index)}
                        className="ml-1 h-4 w-4 p-0 hover:bg-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {formData.status === 'scheduled' && (
                <div className="space-y-2">
                  <Label className="text-white">Publish Date</Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {publishDate ? format(publishDate, 'PPP') : 'Select publish date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                      <CalendarComponent
                        mode="single"
                        selected={publishDate}
                        onSelect={(date) => {
                          setPublishDate(date);
                          setIsDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Meta Title</Label>
                <Input
                  value={formData.seo.metaTitle}
                  onChange={(e) => handleNestedInputChange('seo', 'metaTitle', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="SEO optimized title (60 characters max)"
                />
                <div className="text-xs text-gray-400">{formData.seo.metaTitle.length}/60 characters</div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Meta Description</Label>
                <Textarea
                  value={formData.seo.metaDescription}
                  onChange={(e) => handleNestedInputChange('seo', 'metaDescription', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Brief description for search results (160 characters max)"
                  rows={3}
                />
                <div className="text-xs text-gray-400">{formData.seo.metaDescription.length}/160 characters</div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">SEO Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Add keyword"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" onClick={addKeyword} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.seo.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-700 text-white">
                      {keyword}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKeyword(index)}
                        className="ml-1 h-4 w-4 p-0 hover:bg-green-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Canonical URL</Label>
                <Input
                  value={formData.seo.canonicalUrl}
                  onChange={(e) => handleNestedInputChange('seo', 'canonicalUrl', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="https://example.com/blog/post-slug"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.seo.noIndex}
                  onCheckedChange={(checked) => handleNestedInputChange('seo', 'noIndex', checked)}
                />
                <Label className="text-white">No Index (Hide from search engines)</Label>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.featured.isFeatured}
                  onCheckedChange={(checked) => handleNestedInputChange('featured', 'isFeatured', checked)}
                />
                <Label className="text-white">Featured Post</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Featured Image URL</Label>
                <Input
                  value={formData.featured.image}
                  onChange={(e) => handleNestedInputChange('featured', 'image', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Alt Text</Label>
                  <Input
                    value={formData.featured.imageAlt}
                    onChange={(e) => handleNestedInputChange('featured', 'imageAlt', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Descriptive alt text"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Caption</Label>
                  <Input
                    value={formData.featured.imageCaption}
                    onChange={(e) => handleNestedInputChange('featured', 'imageCaption', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Image caption"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Allow Comments</Label>
                  <Switch
                    checked={formData.settings.allowComments}
                    onCheckedChange={(checked) => handleNestedInputChange('settings', 'allowComments', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Show Author</Label>
                  <Switch
                    checked={formData.settings.showAuthor}
                    onCheckedChange={(checked) => handleNestedInputChange('settings', 'showAuthor', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Show Social Share</Label>
                  <Switch
                    checked={formData.settings.showSocialShare}
                    onCheckedChange={(checked) => handleNestedInputChange('settings', 'showSocialShare', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Show Related Posts</Label>
                  <Switch
                    checked={formData.settings.showRelatedPosts}
                    onCheckedChange={(checked) => handleNestedInputChange('settings', 'showRelatedPosts', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Show Table of Contents</Label>
                  <Switch
                    checked={formData.settings.showToc}
                    onCheckedChange={(checked) => handleNestedInputChange('settings', 'showToc', checked)}
                  />
                </div>
              </div>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Author Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Name</Label>
                      <Input
                        value={formData.author.name}
                        onChange={(e) => handleNestedInputChange('author', 'name', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Email</Label>
                      <Input
                        value={formData.author.email}
                        onChange={(e) => handleNestedInputChange('author', 'email', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Bio</Label>
                    <Textarea
                      value={formData.author.bio}
                      onChange={(e) => handleNestedInputChange('author', 'bio', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">{formData.engagement.views.toLocaleString()}</div>
                      <div className="text-gray-400">Views</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{formData.engagement.likes.toLocaleString()}</div>
                      <div className="text-gray-400">Likes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{formData.engagement.shares.toLocaleString()}</div>
                      <div className="text-gray-400">Shares</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{formData.engagement.comments.toLocaleString()}</div>
                      <div className="text-gray-400">Comments</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{formData.engagement.avgReadTime}m</div>
                      <div className="text-gray-400">Read Time</div>
                    </div>
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
                {post ? 'Update Post' : 'Create Post'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}