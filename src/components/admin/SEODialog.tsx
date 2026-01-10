import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Search, TrendingUp, Globe, Target, BarChart3, Eye, FileText, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SEOContent {
  id: string;
  type: 'seo';
  title: string;
  metaDescription: string;
  content: string;
  url: string;
  status: string;
  contentType: string;
  targetKeywords: string;
  focusKeyword?: string;
  seoScore?: number;
  readabilityScore?: number;
  wordCount: number;
  publishedDate?: string;
  lastModified: string;
  pageViews?: number;
  organicTraffic?: number;
  averagePosition?: number;
  clickThroughRate?: number;
  tags?: string;
  category?: string;
  canonicalUrl?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  createdAt: string;
  updatedAt: string;
}

interface SEODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seo?: SEOContent | null;
  onSave: (seo: Omit<SEOContent, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => void;
  mode: 'create' | 'edit' | 'view';
}

const seoStatuses = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'review', label: 'In Review', color: 'bg-yellow-500' },
  { value: 'optimized', label: 'Optimized', color: 'bg-green-500' },
  { value: 'published', label: 'Published', color: 'bg-blue-500' },
  { value: 'needs-work', label: 'Needs Work', color: 'bg-red-500' },
];

const contentTypes = [
  { value: 'page', label: 'Web Page' },
  { value: 'blog-post', label: 'Blog Post' },
  { value: 'product', label: 'Product Page' },
  { value: 'category', label: 'Category Page' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'service', label: 'Service Page' },
];

const seoCategories = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'services', label: 'Services' },
  { value: 'about', label: 'About' },
  { value: 'blog', label: 'Blog' },
  { value: 'resources', label: 'Resources' },
  { value: 'contact', label: 'Contact' },
];

export function SEODialog({ open, onOpenChange, seo, onSave, mode }: SEODialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    metaDescription: '',
    content: '',
    url: '',
    status: 'draft',
    contentType: 'page',
    targetKeywords: '',
    focusKeyword: '',
    wordCount: 0,
    publishedDate: '',
    tags: '',
    category: 'homepage',
    canonicalUrl: '',
    openGraphTitle: '',
    openGraphDescription: '',
    twitterTitle: '',
    twitterDescription: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enableSocialMedia, setEnableSocialMedia] = useState(false);

  useEffect(() => {
    if (seo && (mode === 'edit' || mode === 'view')) {
      setFormData({
        title: seo.title || '',
        metaDescription: seo.metaDescription || '',
        content: seo.content || '',
        url: seo.url || '',
        status: seo.status || 'draft',
        contentType: seo.contentType || 'page',
        targetKeywords: seo.targetKeywords || '',
        focusKeyword: seo.focusKeyword || '',
        wordCount: seo.wordCount || 0,
        publishedDate: seo.publishedDate ? seo.publishedDate.split('T')[0] : '',
        tags: seo.tags || '',
        category: seo.category || 'homepage',
        canonicalUrl: seo.canonicalUrl || '',
        openGraphTitle: seo.openGraphTitle || '',
        openGraphDescription: seo.openGraphDescription || '',
        twitterTitle: seo.twitterTitle || '',
        twitterDescription: seo.twitterDescription || '',
      });
      setEnableSocialMedia(!!(seo.openGraphTitle || seo.twitterTitle));
    } else if (mode === 'create') {
      setFormData({
        title: '',
        metaDescription: '',
        content: '',
        url: '',
        status: 'draft',
        contentType: 'page',
        targetKeywords: '',
        focusKeyword: '',
        wordCount: 0,
        publishedDate: '',
        tags: '',
        category: 'homepage',
        canonicalUrl: '',
        openGraphTitle: '',
        openGraphDescription: '',
        twitterTitle: '',
        twitterDescription: '',
      });
      setEnableSocialMedia(false);
    }
    setErrors({});
  }, [seo, mode, open]);

  useEffect(() => {
    // Auto-calculate word count
    const words = formData.content.trim().split(/\\s+/).filter(word => word.length > 0);
    setFormData(prev => ({ ...prev, wordCount: words.length }));
  }, [formData.content]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 60) {
      newErrors.title = 'Title should be under 60 characters for best SEO';
    }

    if (!formData.metaDescription.trim()) {
      newErrors.metaDescription = 'Meta description is required';
    } else if (formData.metaDescription.length > 160) {
      newErrors.metaDescription = 'Meta description should be under 160 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!formData.url.startsWith('/') && !formData.url.startsWith('http')) {
      newErrors.url = 'URL should start with / or http';
    }

    if (!formData.targetKeywords.trim()) {
      newErrors.targetKeywords = 'Target keywords are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        title: formData.title,
        metaDescription: formData.metaDescription,
        content: formData.content,
        url: formData.url,
        status: formData.status,
        contentType: formData.contentType,
        targetKeywords: formData.targetKeywords,
        focusKeyword: formData.focusKeyword,
        wordCount: formData.wordCount,
        publishedDate: formData.publishedDate ? new Date(formData.publishedDate).toISOString() : undefined,
        lastModified: new Date().toISOString(),
        tags: formData.tags,
        category: formData.category,
        canonicalUrl: formData.canonicalUrl,
        openGraphTitle: enableSocialMedia ? formData.openGraphTitle : undefined,
        openGraphDescription: enableSocialMedia ? formData.openGraphDescription : undefined,
        twitterTitle: enableSocialMedia ? formData.twitterTitle : undefined,
        twitterDescription: enableSocialMedia ? formData.twitterDescription : undefined,
        seoScore: Math.floor(Math.random() * 40) + 60, // Mock SEO score
        readabilityScore: Math.floor(Math.random() * 30) + 70, // Mock readability score
      });
      onOpenChange(false);
    }
  };

  const getSEOScore = () => {
    let score = 0;
    if (formData.title && formData.title.length <= 60) score += 20;
    if (formData.metaDescription && formData.metaDescription.length <= 160) score += 20;
    if (formData.targetKeywords) score += 15;
    if (formData.focusKeyword) score += 15;
    if (formData.content.length > 300) score += 15;
    if (formData.canonicalUrl) score += 10;
    if (enableSocialMedia && (formData.openGraphTitle || formData.twitterTitle)) score += 5;
    return Math.min(score, 100);
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {mode === 'create' ? 'Create SEO Content' : mode === 'edit' ? 'Edit SEO Content' : 'SEO Content Details'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {mode === 'create'
              ? 'Create optimized content with SEO best practices'
              : mode === 'edit'
              ? 'Update content and SEO optimization settings'
              : 'View content performance and SEO metrics'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'view' && seo && (
          <div className="space-y-6">
            {/* SEO Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">SEO Score</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full transition-all",
                        (seo.seoScore || 0) >= 80 ? "bg-green-500" : 
                        (seo.seoScore || 0) >= 60 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${seo.seoScore || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-medium">{seo.seoScore || 0}/100</span>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Page Views</span>
                </div>
                <p className="text-white font-medium">{seo.pageViews?.toLocaleString() || 'N/A'}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Avg Position</span>
                </div>
                <p className="text-white font-medium">{seo.averagePosition ? `#${seo.averagePosition}` : 'N/A'}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">CTR</span>
                </div>
                <p className="text-white font-medium">{seo.clickThroughRate ? `${seo.clickThroughRate}%` : 'N/A'}</p>
              </div>
            </div>

            {/* Content Details */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Content Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Title</Label>
                    <p className="text-white mt-1">{seo.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">URL</Label>
                    <p className="text-blue-400 mt-1">{seo.url}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-300">Meta Description</Label>
                  <p className="text-gray-400 mt-1">{seo.metaDescription}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Focus Keyword</Label>
                    <p className="text-white mt-1">{seo.focusKeyword || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Word Count</Label>
                    <p className="text-white mt-1">{seo.wordCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Content Type</Label>
                    <p className="text-white mt-1">{contentTypes.find(t => t.value === seo.contentType)?.label || seo.contentType}</p>
                  </div>
                </div>

                {seo.targetKeywords && (
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Target Keywords</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {seo.targetKeywords.split(',').map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-gray-300 border-gray-600">
                          {keyword.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {(mode === 'create' || mode === 'edit') && (
          <div className="space-y-6">
            {/* Real-time SEO Score */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-300">SEO Score</Label>
                <span className="text-white font-medium">{getSEOScore()}/100</span>
              </div>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all",
                    getSEOScore() >= 80 ? "bg-green-500" : 
                    getSEOScore() >= 60 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${getSEOScore()}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Page title (max 60 characters)"
                  maxLength={60}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{errors.title && <span className="text-red-400">{errors.title}</span>}</span>
                  <span>{formData.title.length}/60</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">URL *</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="/page-url or https://example.com"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
                {errors.url && <p className="text-red-400 text-xs mt-1">{errors.url}</p>}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Meta Description *</Label>
              <Textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="Description that appears in search results (max 160 characters)"
                maxLength={160}
                rows={3}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={isReadOnly}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{errors.metaDescription && <span className="text-red-400">{errors.metaDescription}</span>}</span>
                <span>{formData.metaDescription.length}/160</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Content Type</Label>
                <Select value={formData.contentType} onValueChange={(value) => setFormData({ ...formData, contentType: value })} disabled={isReadOnly}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} disabled={isReadOnly}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {seoCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value} className="text-white">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })} disabled={isReadOnly}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {seoStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value} className="text-white">
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Target Keywords *</Label>
                <Input
                  value={formData.targetKeywords}
                  onChange={(e) => setFormData({ ...formData, targetKeywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
                {errors.targetKeywords && <p className="text-red-400 text-xs mt-1">{errors.targetKeywords}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Focus Keyword</Label>
                <Input
                  value={formData.focusKeyword}
                  onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                  placeholder="Primary keyword to optimize for"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Page content (aim for 300+ words for better SEO)"
                rows={8}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={isReadOnly}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{errors.content && <span className="text-red-400">{errors.content}</span>}</span>
                <span>{formData.wordCount} words</span>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Canonical URL</Label>
              <Input
                value={formData.canonicalUrl}
                onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                placeholder="https://example.com/canonical-page (optional)"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={isReadOnly}
              />
            </div>

            {/* Social Media Tags */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Switch 
                  checked={enableSocialMedia} 
                  onCheckedChange={setEnableSocialMedia}
                  disabled={isReadOnly}
                />
                <Label className="text-sm font-medium text-gray-300">Enable Social Media Tags</Label>
              </div>

              {enableSocialMedia && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Open Graph Title</Label>
                    <Input
                      value={formData.openGraphTitle}
                      onChange={(e) => setFormData({ ...formData, openGraphTitle: e.target.value })}
                      placeholder="Facebook/LinkedIn title"
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Twitter Title</Label>
                    <Input
                      value={formData.twitterTitle}
                      onChange={(e) => setFormData({ ...formData, twitterTitle: e.target.value })}
                      placeholder="Twitter/X title"
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Open Graph Description</Label>
                    <Textarea
                      value={formData.openGraphDescription}
                      onChange={(e) => setFormData({ ...formData, openGraphDescription: e.target.value })}
                      placeholder="Facebook/LinkedIn description"
                      rows={2}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Twitter Description</Label>
                    <Textarea
                      value={formData.twitterDescription}
                      onChange={(e) => setFormData({ ...formData, twitterDescription: e.target.value })}
                      placeholder="Twitter/X description"
                      rows={2}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Tags</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-300">Published Date</Label>
                <Input
                  type="date"
                  value={formData.publishedDate}
                  onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {mode === 'create' ? 'Create Content' : 'Save Changes'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}