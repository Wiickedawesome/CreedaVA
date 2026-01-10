import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface SocialMediaPost {
  id?: string;
  title: string;
  content: string;
  platform: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledDate?: Date;
  publishedDate?: Date;
  hashtags: string[];
  images: string[];
  engagementMetrics?: {
    likes: number;
    shares: number;
    comments: number;
    reach: number;
  };
  isAiGenerated: boolean;
  aiPrompt?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SocialMediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: Omit<SocialMediaPost, 'id'>) => void;
  post?: SocialMediaPost;
}

const platforms = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'pinterest', label: 'Pinterest' }
];

const contentTemplates = {
  promotional: "🚀 Exciting news! [Your announcement here]\n\n✨ Key benefits:\n• [Benefit 1]\n• [Benefit 2]\n• [Benefit 3]\n\n#YourBrand #Innovation",
  educational: "💡 Did you know? [Educational fact or tip]\n\n📚 Here's what you need to know:\n[Detailed explanation]\n\n#TipTuesday #Learning #Education",
  engagement: "🤔 We'd love to hear from you!\n\n[Question or poll]\n\nDrop your thoughts in the comments below! 👇\n\n#Community #Engagement",
  behind_scenes: "🎬 Behind the scenes at [Company Name]!\n\n[Description of what's happening]\n\nWe love sharing our journey with you! ✨\n\n#BehindTheScenes #TeamWork"
};

export function SocialMediaDialog({ isOpen, onClose, onSave, post }: SocialMediaDialogProps) {
  const [formData, setFormData] = useState<Partial<SocialMediaPost>>({
    title: post?.title || '',
    content: post?.content || '',
    platform: post?.platform || 'facebook',
    status: post?.status || 'draft',
    scheduledDate: post?.scheduledDate || undefined,
    hashtags: post?.hashtags || [],
    images: post?.images || [],
    isAiGenerated: post?.isAiGenerated || false,
    aiPrompt: post?.aiPrompt || '',
    userId: 'user_1' // TODO: Get from auth context
  });
  
  const [newHashtag, setNewHashtag] = useState('');
  const [newImage, setNewImage] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Post title is required';
    }
    
    if (!formData.content?.trim()) {
      newErrors.content = 'Post content is required';
    }
    
    if (!formData.platform) {
      newErrors.platform = 'Platform selection is required';
    }
    
    if (formData.status === 'scheduled' && !formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required for scheduled posts';
    }
    
    const characterLimit = getCharacterLimit(formData.platform || '');
    if (formData.content && formData.content.length > characterLimit) {
      newErrors.content = `Content exceeds ${characterLimit} character limit for ${formData.platform}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSave(formData as Omit<SocialMediaPost, 'id'>);
    onClose();
  };

  const addHashtag = () => {
    if (newHashtag && !formData.hashtags?.includes(newHashtag)) {
      setFormData(prev => ({
        ...prev,
        hashtags: [...(prev.hashtags || []), newHashtag]
      }));
      setNewHashtag('');
    }
  };

  const removeHashtag = (hashtag: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags?.filter(h => h !== hashtag) || []
    }));
  };

  const addImage = () => {
    if (newImage && !formData.images?.includes(newImage)) {
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), newImage]
      }));
      setNewImage('');
    }
  };

  const removeImage = (image: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter(img => img !== image) || []
    }));
  };

  const useTemplate = (template: keyof typeof contentTemplates) => {
    setFormData(prev => ({
      ...prev,
      content: contentTemplates[template]
    }));
  };

  const generateWithAI = () => {
    if (!formData.aiPrompt) return;
    
    // Simulate AI content generation
    const generatedContent = `🤖 AI-Generated Content based on: "${formData.aiPrompt}"\n\nThis is a sample AI-generated social media post. In a real implementation, this would connect to an AI service like OpenAI's GPT to generate engaging content based on your prompt.\n\n#AI #SocialMedia #CreedaVA`;
    
    setFormData(prev => ({
      ...prev,
      content: generatedContent,
      isAiGenerated: true
    }));
  };

  const getCharacterLimit = (platform: string) => {
    switch (platform) {
      case 'twitter': return 280;
      case 'facebook': return 63206;
      case 'instagram': return 2200;
      case 'linkedin': return 3000;
      case 'tiktok': return 4000;
      case 'youtube': return 5000;
      case 'pinterest': return 500;
      default: return 280;
    }
  };

  const characterLimit = getCharacterLimit(formData.platform || 'facebook');
  const charactersUsed = formData.content?.length || 0;
  const charactersRemaining = characterLimit - charactersUsed;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {post ? 'Edit Social Media Post' : 'Create New Social Media Post'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create and schedule your social media content across multiple platforms.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">Post Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, title: e.target.value }));
                    if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                  }}
                  placeholder="Enter post title..."
                  className={`bg-gray-800 border-gray-600 text-white ${
                    errors.title ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  required
                />
                {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="platform" className="text-white">Platform *</Label>
                <Select 
                  value={formData.platform || 'facebook'} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, platform: value }));
                    if (errors.platform) setErrors(prev => ({ ...prev, platform: '' }));
                  }}
                >
                  <SelectTrigger className={`bg-gray-800 border-gray-600 text-white ${
                    errors.platform ? 'border-red-500 focus:border-red-500' : ''
                  }`}>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value} className="text-white hover:bg-gray-700">
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.platform && <p className="text-red-400 text-sm mt-1">{errors.platform}</p>}
              </div>

              <div>
                <Label htmlFor="status" className="text-white">Status</Label>
                <Select value={formData.status || 'draft'} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="draft" className="text-white hover:bg-gray-700">Draft</SelectItem>
                    <SelectItem value="scheduled" className="text-white hover:bg-gray-700">Scheduled</SelectItem>
                    <SelectItem value="published" className="text-white hover:bg-gray-700">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Templates */}
              <div>
                <Label className="text-white">Quick Templates</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => useTemplate('promotional')} className="text-sm bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                    Promotional
                  </Button>
                  <Button type="button" variant="outline" onClick={() => useTemplate('educational')} className="text-sm bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                    Educational
                  </Button>
                  <Button type="button" variant="outline" onClick={() => useTemplate('engagement')} className="text-sm bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                    Engagement
                  </Button>
                  <Button type="button" variant="outline" onClick={() => useTemplate('behind_scenes')} className="text-sm bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                    Behind Scenes
                  </Button>
                </div>
              </div>

              {/* AI Content Generation */}
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Switch
                    checked={formData.isAiGenerated || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAiGenerated: checked }))}
                  />
                  <Label className="text-white">AI Content Generation</Label>
                </div>
                {formData.isAiGenerated && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Describe what you want to post about..."
                      value={formData.aiPrompt || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, aiPrompt: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                    <Button 
                      type="button" 
                      onClick={generateWithAI} 
                      className="w-full bg-purple-600 hover:bg-purple-700" 
                      disabled={!formData.aiPrompt}
                    >
                      Generate Content with AI
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="content" className="text-white">Post Content *</Label>
                  <span className={`text-sm ${charactersRemaining < 0 ? 'text-red-400' : charactersRemaining < 50 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {charactersUsed}/{characterLimit}
                  </span>
                </div>
                <Textarea
                  id="content"
                  value={formData.content || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, content: e.target.value }));
                    if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
                  }}
                  placeholder="Write your post content..."
                  className={`min-h-[200px] bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${
                    errors.content ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  required
                />
                {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content}</p>}
              </div>

              {/* Hashtags */}
              <div>
                <Label className="text-white">Hashtags</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    placeholder="hashtag"
                    className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                  />
                  <Button type="button" onClick={addHashtag} className="bg-blue-600 hover:bg-blue-700">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.hashtags?.map((hashtag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-700 text-blue-200"
                    >
                      #{hashtag}
                      <button
                        type="button"
                        onClick={() => removeHashtag(hashtag)}
                        className="ml-1 text-blue-200 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <Label className="text-white">Images</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="Image URL"
                    className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  />
                  <Button type="button" onClick={addImage} className="bg-blue-600 hover:bg-blue-700">Add</Button>
                </div>
                <div className="space-y-2 mt-2">
                  {formData.images?.map((image, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-800 border border-gray-700 rounded">
                      <span className="text-sm text-gray-300 truncate">{image}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(image)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scheduling */}
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Switch
                    checked={showScheduler}
                    onCheckedChange={(checked) => {
                      setShowScheduler(checked);
                      if (checked) {
                        setFormData(prev => ({ ...prev, status: 'scheduled' }));
                      }
                    }}
                  />
                  <Label className="text-white">Schedule Post</Label>
                </div>
                {showScheduler && (
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.scheduledDate ? format(formData.scheduledDate, 'PPP p') : 'Select date and time'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.scheduledDate}
                          onSelect={(date) => {
                            setFormData(prev => ({ ...prev, scheduledDate: date }));
                            if (errors.scheduledDate) setErrors(prev => ({ ...prev, scheduledDate: '' }));
                          }}
                          initialFocus
                          className="bg-gray-800 text-white"
                        />
                        <div className="p-3 border-t border-gray-700">
                          <Input
                            type="time"
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':');
                              if (formData.scheduledDate) {
                                const newDate = new Date(formData.scheduledDate);
                                newDate.setHours(parseInt(hours), parseInt(minutes));
                                setFormData(prev => ({ ...prev, scheduledDate: newDate }));
                              }
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {post ? 'Update Post' : 'Create Post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}