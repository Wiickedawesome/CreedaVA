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
import { Calendar, CalendarIcon, Globe, Code, Palette, Target, BarChart, Users, Zap, Plus, X, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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

interface LandingPagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<LandingPage, 'id'>) => void;
  landingPage?: LandingPage;
}

const templates = [
  { id: 'modern', name: 'Modern Hero', description: 'Clean design with hero section and features' },
  { id: 'startup', name: 'Startup', description: 'Perfect for SaaS and tech products' },
  { id: 'agency', name: 'Agency', description: 'Professional layout for service businesses' },
  { id: 'ecommerce', name: 'E-commerce', description: 'Product-focused with conversion elements' },
  { id: 'leadgen', name: 'Lead Generation', description: 'Form-focused with minimal distractions' },
  { id: 'event', name: 'Event', description: 'Event registration and information' },
  { id: 'portfolio', name: 'Portfolio', description: 'Showcase work and testimonials' },
  { id: 'webinar', name: 'Webinar', description: 'Webinar signup and details' }
];

const sectionTypes = [
  { id: 'hero', name: 'Hero Section', icon: Zap, description: 'Main headline and call-to-action' },
  { id: 'features', name: 'Features', icon: Target, description: 'Product or service features' },
  { id: 'testimonials', name: 'Testimonials', icon: Users, description: 'Customer testimonials and reviews' },
  { id: 'pricing', name: 'Pricing', icon: BarChart, description: 'Pricing tables and plans' },
  { id: 'cta', name: 'Call to Action', icon: Plus, description: 'Conversion-focused section' },
  { id: 'form', name: 'Form', icon: Target, description: 'Contact or signup form' },
  { id: 'content', name: 'Content', icon: Globe, description: 'Rich text content block' }
];

export function LandingPagesDialog({ isOpen, onClose, onSave, landingPage }: LandingPagesDialogProps) {
  const [formData, setFormData] = useState<Omit<LandingPage, 'id'>>({
    name: '',
    title: '',
    description: '',
    url: '',
    slug: '',
    template: 'modern',
    status: 'draft',
    content: {
      sections: [
        {
          id: '1',
          type: 'hero',
          title: 'Hero Section',
          content: 'Main headline and description',
          order: 1,
          settings: {}
        }
      ],
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1F2937',
        fontFamily: 'Inter',
        backgroundColor: '#FFFFFF'
      },
      customCSS: '',
      customJS: ''
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
      ogImage: '',
      canonicalUrl: '',
      noIndex: false
    },
    tracking: {
      googleAnalytics: '',
      facebookPixel: '',
      customTracking: []
    },
    abTesting: {
      enabled: false,
      variants: [],
      goal: 'conversions',
      winnerCriteria: 95
    },
    performance: {
      views: 0,
      uniqueViews: 0,
      conversions: 0,
      conversionRate: 0,
      avgTimeOnPage: 0,
      bounceRate: 0,
      topSources: []
    },
    forms: [],
    integrations: {
      crmConnected: false,
      emailMarketing: '',
      webHooks: []
    },
    userId: 'current-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [newSection, setNewSection] = useState({ type: 'content', title: '', content: '' });
  const [newVariant, setNewVariant] = useState({ name: '', traffic: 50 });
  const [publishDate, setPublishDate] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (landingPage) {
      setFormData(landingPage);
      setPublishDate(landingPage.publishedAt ? new Date(landingPage.publishedAt) : undefined);
    }
  }, [landingPage]);

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

  const addKeyword = () => {
    if (newKeyword.trim()) {
      handleArrayAdd('seo', 'keywords', newKeyword.trim());
      setNewKeyword('');
    }
  };

  const addSection = () => {
    if (newSection.title.trim()) {
      const section = {
        id: Date.now().toString(),
        type: newSection.type as any,
        title: newSection.title,
        content: newSection.content,
        order: formData.content.sections.length + 1,
        settings: {}
      };
      handleArrayAdd('content', 'sections', section);
      setNewSection({ type: 'content', title: '', content: '' });
    }
  };

  const addABVariant = () => {
    if (newVariant.name.trim()) {
      const variant = {
        name: newVariant.name,
        traffic: newVariant.traffic,
        changes: {}
      };
      handleArrayAdd('abTesting', 'variants', variant);
      setNewVariant({ name: '', traffic: 50 });
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      slug: formData.slug || generateSlug(formData.title),
      url: formData.url || `/${formData.slug || generateSlug(formData.title)}`,
      publishedAt: publishDate,
      updatedAt: new Date().toISOString()
    };
    onSave(dataToSave);
  };

  const simulateAI = (type: string) => {
    const suggestions = {
      title: [
        'Transform Your Business Today',
        'Unlock Your Potential',
        'Revolutionary Solutions Await',
        'Experience the Difference'
      ],
      description: [
        'Discover innovative solutions that drive real results and transform your business operations.',
        'Join thousands of satisfied customers who have transformed their business with our platform.',
        'Experience cutting-edge technology designed to maximize your potential and drive growth.'
      ],
      content: [
        'Our comprehensive solution delivers measurable results through innovative technology and expert support.',
        'Transform your workflow with intelligent automation and data-driven insights that accelerate growth.'
      ]
    };
    
    return suggestions[type as keyof typeof suggestions][Math.floor(Math.random() * suggestions[type as keyof typeof suggestions].length)];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {landingPage ? 'Edit Landing Page' : 'Create New Landing Page'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {landingPage ? 'Modify landing page settings and content.' : 'Create a high-converting landing page with A/B testing and analytics.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gray-800">
              <TabsTrigger value="basic" className="data-[state=active]:bg-gray-700">Basic</TabsTrigger>
              <TabsTrigger value="design" className="data-[state=active]:bg-gray-700">Design</TabsTrigger>
              <TabsTrigger value="seo" className="data-[state=active]:bg-gray-700">SEO</TabsTrigger>
              <TabsTrigger value="tracking" className="data-[state=active]:bg-gray-700">Tracking</TabsTrigger>
              <TabsTrigger value="testing" className="data-[state=active]:bg-gray-700">A/B Testing</TabsTrigger>
              <TabsTrigger value="forms" className="data-[state=active]:bg-gray-700">Forms</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Page Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Internal page name"
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
                      <SelectItem value="archived">Archived</SelectItem>
                      <SelectItem value="testing">A/B Testing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  Page Title
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInputChange('title', simulateAI('title'))}
                    className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    ✨ AI Suggest
                  </Button>
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Main page title"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  Description
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInputChange('description', simulateAI('description'))}
                    className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    ✨ AI Suggest
                  </Button>
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Brief description of the page purpose"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">URL Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="page-url-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Template</Label>
                  <Select value={formData.template} onValueChange={(value) => handleInputChange('template', value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} - {template.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Publish Date (Optional)</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
            </TabsContent>

            <TabsContent value="design" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Content Sections
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage the sections and content blocks of your landing page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Select value={newSection.type} onValueChange={(value) => setNewSection(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={newSection.title}
                      onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Section title"
                    />
                    <Button
                      type="button"
                      onClick={addSection}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {formData.content.sections.map((section, index) => (
                      <div key={section.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-medium">
                            {section.order}
                          </div>
                          <div>
                            <div className="text-white font-medium">{section.title}</div>
                            <div className="text-gray-400 text-sm capitalize">{section.type} section</div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArrayRemove('content', 'sections', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Theme Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.content.theme.primaryColor}
                          onChange={(e) => handleNestedInputChange('content', 'theme', { ...formData.content.theme, primaryColor: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <input
                          type="color"
                          value={formData.content.theme.primaryColor}
                          onChange={(e) => handleNestedInputChange('content', 'theme', { ...formData.content.theme, primaryColor: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-600"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.content.theme.secondaryColor}
                          onChange={(e) => handleNestedInputChange('content', 'theme', { ...formData.content.theme, secondaryColor: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <input
                          type="color"
                          value={formData.content.theme.secondaryColor}
                          onChange={(e) => handleNestedInputChange('content', 'theme', { ...formData.content.theme, secondaryColor: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Meta Title</Label>
                  <Input
                    value={formData.seo.metaTitle}
                    onChange={(e) => handleNestedInputChange('seo', 'metaTitle', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="SEO title for search engines"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Meta Description</Label>
                  <Textarea
                    value={formData.seo.metaDescription}
                    onChange={(e) => handleNestedInputChange('seo', 'metaDescription', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Brief description for search results"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Keywords</Label>
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
                      <Badge key={index} variant="secondary" className="bg-gray-700 text-white">
                        {keyword}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArrayRemove('seo', 'keywords', index)}
                          className="ml-1 h-4 w-4 p-0 hover:bg-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.seo.noIndex}
                    onCheckedChange={(checked) => handleNestedInputChange('seo', 'noIndex', checked)}
                  />
                  <Label className="text-white">No Index (Hide from search engines)</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tracking" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Google Analytics ID</Label>
                  <Input
                    value={formData.tracking.googleAnalytics}
                    onChange={(e) => handleNestedInputChange('tracking', 'googleAnalytics', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="GA-XXXXXXXXX-X"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Facebook Pixel ID</Label>
                  <Input
                    value={formData.tracking.facebookPixel}
                    onChange={(e) => handleNestedInputChange('tracking', 'facebookPixel', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Facebook Pixel ID"
                  />
                </div>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-white">{formData.performance.views.toLocaleString()}</div>
                        <div className="text-gray-400">Total Views</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{formData.performance.conversions.toLocaleString()}</div>
                        <div className="text-gray-400">Conversions</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{formData.performance.conversionRate.toFixed(2)}%</div>
                        <div className="text-gray-400">Conversion Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.abTesting.enabled}
                    onCheckedChange={(checked) => handleNestedInputChange('abTesting', 'enabled', checked)}
                  />
                  <Label className="text-white">Enable A/B Testing</Label>
                </div>

                {formData.abTesting.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Goal Metric</Label>
                        <Select 
                          value={formData.abTesting.goal} 
                          onValueChange={(value: any) => handleNestedInputChange('abTesting', 'goal', value)}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conversions">Conversions</SelectItem>
                            <SelectItem value="clicks">Clicks</SelectItem>
                            <SelectItem value="time">Time on Page</SelectItem>
                            <SelectItem value="scroll">Scroll Depth</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Winner Criteria (%)</Label>
                        <Input
                          type="number"
                          value={formData.abTesting.winnerCriteria}
                          onChange={(e) => handleNestedInputChange('abTesting', 'winnerCriteria', Number(e.target.value))}
                          className="bg-gray-800 border-gray-600 text-white"
                          min="90" max="99"
                        />
                      </div>
                    </div>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">A/B Test Variants</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <Input
                            value={newVariant.name}
                            onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Variant name"
                          />
                          <Input
                            type="number"
                            value={newVariant.traffic}
                            onChange={(e) => setNewVariant(prev => ({ ...prev, traffic: Number(e.target.value) }))}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Traffic %"
                            min="1" max="99"
                          />
                          <Button
                            type="button"
                            onClick={addABVariant}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Variant
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {formData.abTesting.variants.map((variant, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                              <div>
                                <div className="text-white font-medium">{variant.name}</div>
                                <div className="text-gray-400 text-sm">{variant.traffic}% traffic</div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArrayRemove('abTesting', 'variants', index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="forms" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Form Integration</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure forms and lead capture settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Email Marketing Integration</Label>
                    <Select 
                      value={formData.integrations.emailMarketing} 
                      onValueChange={(value) => handleNestedInputChange('integrations', 'emailMarketing', value)}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select email service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mailchimp">Mailchimp</SelectItem>
                        <SelectItem value="convertkit">ConvertKit</SelectItem>
                        <SelectItem value="hubspot">HubSpot</SelectItem>
                        <SelectItem value="activecampaign">ActiveCampaign</SelectItem>
                        <SelectItem value="getresponse">GetResponse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.integrations.crmConnected}
                      onCheckedChange={(checked) => handleNestedInputChange('integrations', 'crmConnected', checked)}
                    />
                    <Label className="text-white">Connect to CRM</Label>
                  </div>

                  <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                    <Target className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-400">Form builder will be available in future updates</p>
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
                {landingPage ? 'Update Landing Page' : 'Create Landing Page'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}