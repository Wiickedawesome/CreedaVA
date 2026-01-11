import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Target, DollarSign, Users } from 'lucide-react';
import { format } from 'date-fns';

interface AdCampaign {
  id?: string;
  name: string;
  platform: string;
  campaignType: string;
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
  createdAt?: string;
  updatedAt?: string;
}

interface AdCampaignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: Omit<AdCampaign, 'id'>) => void;
  campaign?: AdCampaign;
}

const platforms = [
  { value: 'google', label: 'Google Ads' },
  { value: 'facebook', label: 'Facebook Ads' },
  { value: 'instagram', label: 'Instagram Ads' },
  { value: 'linkedin', label: 'LinkedIn Ads' },
  { value: 'twitter', label: 'Twitter Ads' },
  { value: 'youtube', label: 'YouTube Ads' },
  { value: 'tiktok', label: 'TikTok Ads' },
  { value: 'bing', label: 'Microsoft Ads' }
];

const campaignTypes = {
  google: ['Search', 'Display', 'Video', 'Shopping', 'App'],
  facebook: ['Traffic', 'Conversions', 'Brand Awareness', 'Reach', 'Engagement'],
  instagram: ['Brand Awareness', 'Reach', 'Traffic', 'Engagement', 'App Installs'],
  linkedin: ['Brand Awareness', 'Website Visits', 'Engagement', 'Lead Generation'],
  twitter: ['Reach', 'Video Views', 'Website Clicks', 'Engagements', 'App Installs'],
  youtube: ['Brand Awareness', 'Reach', 'Consideration', 'Conversions'],
  tiktok: ['Reach', 'Traffic', 'Conversions', 'App Installs'],
  bing: ['Search', 'Audience', 'Shopping', 'Microsoft Advertising Intelligence']
};

const objectives = [
  'Brand Awareness',
  'Reach',
  'Traffic',
  'Engagement',
  'App Installs',
  'Video Views',
  'Lead Generation',
  'Conversions',
  'Catalog Sales',
  'Store Traffic'
];

const bidStrategies = [
  'Manual CPC',
  'Enhanced CPC',
  'Target CPA',
  'Target ROAS',
  'Maximize Clicks',
  'Maximize Conversions',
  'Target Impression Share',
  'CPM',
  'vCPM'
];

const callToActions = [
  'Learn More',
  'Shop Now',
  'Sign Up',
  'Download',
  'Contact Us',
  'Get Quote',
  'Book Now',
  'Subscribe',
  'Try Free',
  'Watch Video'
];

export function AdCampaignDialog({ isOpen, onClose, onSave, campaign }: AdCampaignDialogProps) {
  const [formData, setFormData] = useState<Partial<AdCampaign>>({
    name: campaign?.name || '',
    platform: campaign?.platform || 'google',
    campaignType: campaign?.campaignType || 'Search',
    objective: campaign?.objective || 'Traffic',
    status: campaign?.status || 'draft',
    budget: campaign?.budget || {
      total: 1000,
      daily: 50,
      spent: 0,
      currency: 'USD'
    },
    targeting: campaign?.targeting || {
      demographics: {
        ageMin: 18,
        ageMax: 65,
        genders: ['All'],
        locations: ['United States']
      },
      interests: [],
      behaviors: [],
      keywords: []
    },
    creative: campaign?.creative || {
      headline: '',
      description: '',
      images: [],
      videos: [],
      callToAction: 'Learn More'
    },
    schedule: campaign?.schedule || {
      startDate: new Date(),
      endDate: undefined,
      timezone: 'UTC',
      dayParting: {
        enabled: false,
        schedule: []
      }
    },
    performance: campaign?.performance || {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      roas: 0
    },
    bidStrategy: campaign?.bidStrategy || 'Manual CPC',
    maxBid: campaign?.maxBid || undefined,
    isABTesting: campaign?.isABTesting || false,
    abTestVariants: campaign?.abTestVariants || [],
    conversionTracking: campaign?.conversionTracking || {
      enabled: false,
      pixelId: '',
      events: []
    },
    notes: campaign?.notes || '',
    userId: 'admin' // Using admin as default for now
  });
  
  const [newKeyword, setNewKeyword] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Performance metrics are recorded by tracking/integration systems; keep initial metrics empty.
    if (!campaign) {
      formData.performance = {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        roas: 0
      };
    }
    
    onSave(formData as Omit<AdCampaign, 'id'>);
    onClose();
  };

  const addKeyword = () => {
    if (newKeyword && !formData.targeting?.keywords?.includes(newKeyword)) {
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting!,
          keywords: [...(prev.targeting?.keywords || []), newKeyword]
        }
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting!,
        keywords: prev.targeting?.keywords?.filter(k => k !== keyword) || []
      }
    }));
  };

  const addInterest = () => {
    if (newInterest && !formData.targeting?.interests?.includes(newInterest)) {
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting!,
          interests: [...(prev.targeting?.interests || []), newInterest]
        }
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting!,
        interests: prev.targeting?.interests?.filter(i => i !== interest) || []
      }
    }));
  };

  const addLocation = () => {
    if (newLocation && !formData.targeting?.demographics?.locations?.includes(newLocation)) {
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting!,
          demographics: {
            ...prev.targeting!.demographics,
            locations: [...(prev.targeting?.demographics?.locations || []), newLocation]
          }
        }
      }));
      setNewLocation('');
    }
  };

  const removeLocation = (location: string) => {
    setFormData(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting!,
        demographics: {
          ...prev.targeting!.demographics,
          locations: prev.targeting?.demographics?.locations?.filter(l => l !== location) || []
        }
      }
    }));
  };

  const getEstimatedReach = () => {
    // Mock calculation based on targeting criteria
    const baseReach = 1000000;
    const ageRange = (formData.targeting?.demographics?.ageMax || 65) - (formData.targeting?.demographics?.ageMin || 18);
    const locationCount = formData.targeting?.demographics?.locations?.length || 1;
    const interestCount = formData.targeting?.interests?.length || 1;
    
    const estimatedReach = Math.floor(baseReach * (ageRange / 47) * locationCount * Math.max(1, interestCount * 0.1));
    return estimatedReach.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {campaign ? 'Edit Ad Campaign' : 'Create New Ad Campaign'}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Set up and manage your advertising campaigns across multiple platforms.
            <div className="text-xs text-gray-400 mt-2">Performance metrics will appear after a campaign runs or when tracking is enabled.</div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 p-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-white">Campaign Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter campaign name..."
                  className=""
                  required
                />
              </div>

              <div>
                <Label htmlFor="platform" className="text-white">Platform</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value, campaignType: campaignTypes[value as keyof typeof campaignTypes]?.[0] || 'Search' }))}>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type" className="text-white">Campaign Type</Label>
                <Select value={formData.campaignType} onValueChange={(value) => setFormData(prev => ({ ...prev, campaignType: value }))}>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(campaignTypes[formData.platform as keyof typeof campaignTypes] || campaignTypes.google).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="objective" className="text-white">Objective</Label>
                <Select value={formData.objective} onValueChange={(value) => setFormData(prev => ({ ...prev, objective: value }))}>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select objective" />
                  </SelectTrigger>
                  <SelectContent>
                    {objectives.map((objective) => (
                      <SelectItem key={objective} value={objective}>
                        {objective}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="text-white">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget */}
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Budget & Bidding
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="totalBudget" className="text-white">Total Budget ($)</Label>
                    <Input
                      id="totalBudget"
                      type="number"
                      min="1"
                      value={formData.budget?.total}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        budget: { ...prev.budget!, total: parseInt(e.target.value) || 0 }
                      }))}
                      className=""
                    />
                  </div>
                  <div>
                    <Label htmlFor="dailyBudget" className="text-white">Daily Budget ($)</Label>
                    <Input
                      id="dailyBudget"
                      type="number"
                      min="1"
                      value={formData.budget?.daily}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        budget: { ...prev.budget!, daily: parseInt(e.target.value) || 0 }
                      }))}
                      className=""
                    />
                  </div>
                  <div>
                    <Label htmlFor="bidStrategy" className="text-white">Bid Strategy</Label>
                    <Select value={formData.bidStrategy} onValueChange={(value) => setFormData(prev => ({ ...prev, bidStrategy: value }))}>
                      <SelectTrigger className="">
                        <SelectValue placeholder="Select bid strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        {bidStrategies.map((strategy) => (
                          <SelectItem key={strategy} value={strategy}>
                            {strategy}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column - Targeting */}
            <div className="space-y-6">
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Audience Targeting
                </h4>
                
                {/* Demographics */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="ageMin" className="text-gray-300">Age Min</Label>
                      <Input
                        id="ageMin"
                        type="number"
                        min="13"
                        max="65"
                        value={formData.targeting?.demographics?.ageMin}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          targeting: {
                            ...prev.targeting!,
                            demographics: {
                              ...prev.targeting!.demographics,
                              ageMin: parseInt(e.target.value) || 18
                            }
                          }
                        }))}
                        className=""
                      />
                    </div>
                    <div>
                      <Label htmlFor="ageMax" className="text-gray-300">Age Max</Label>
                      <Input
                        id="ageMax"
                        type="number"
                        min="13"
                        max="65"
                        value={formData.targeting?.demographics?.ageMax}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          targeting: {
                            ...prev.targeting!,
                            demographics: {
                              ...prev.targeting!.demographics,
                              ageMax: parseInt(e.target.value) || 65
                            }
                          }
                        }))}
                        className=""
                      />
                    </div>
                  </div>

                  {/* Locations */}
                  <div>
                    <Label className="text-gray-300">Locations</Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="City, State, Country"
                        className="flex-1 "
                      />
                      <Button type="button" onClick={addLocation} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.targeting?.demographics?.locations?.map((location, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-900/40 text-blue-300 border border-blue-700">
                          {location}
                          <button
                            type="button"
                            onClick={() => removeLocation(location)}
                            className="ml-1 text-blue-300 hover:text-blue-200"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <Label className="text-gray-300">Interests</Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Interest category"
                        className="flex-1 "
                      />
                      <Button type="button" onClick={addInterest} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.targeting?.interests?.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-900/40 text-green-300 border border-green-700">
                          {interest}
                          <button
                            type="button"
                            onClick={() => removeInterest(interest)}
                            className="ml-1 text-green-300 hover:text-green-200"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Keywords (for search campaigns) */}
                  {(formData.platform === 'google' || formData.platform === 'bing') && (
                    <div>
                      <Label className="text-gray-300">Keywords</Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="keyword phrase"
                          className="flex-1 "
                        />
                        <Button type="button" onClick={addKeyword} size="sm">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.targeting?.keywords?.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="bg-purple-900/40 text-purple-300 border border-purple-700">
                            {keyword}
                            <button
                              type="button"
                              onClick={() => removeKeyword(keyword)}
                              className="ml-1 text-purple-300 hover:text-purple-200"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estimated Reach */}
                  <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg">
                    <div className="flex items-center text-sm text-gray-300">
                      <Users className="w-4 h-4 mr-2" />
                      Estimated Reach: <span className="font-medium ml-1">{getEstimatedReach()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                <h4 className="font-medium text-white mb-3">Schedule</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-300">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.schedule?.startDate ? format(formData.schedule.startDate, 'PPP') : 'Select start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-900 border border-gray-700" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.schedule?.startDate}
                          onSelect={(date) => setFormData(prev => ({
                            ...prev,
                            schedule: { ...prev.schedule!, startDate: date || new Date() }
                          }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!formData.schedule?.endDate}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        schedule: { 
                          ...prev.schedule!, 
                          endDate: checked ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined 
                        }
                      }))}
                    />
                    <Label className="text-gray-300">Set End Date</Label>
                  </div>
                  
                  {formData.schedule?.endDate && (
                    <div>
                      <Label className="text-gray-300">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.schedule.endDate ? format(formData.schedule.endDate, 'PPP') : 'Select end date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.schedule.endDate}
                            onSelect={(date) => setFormData(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule!, endDate: date }
                            }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Creative */}
            <div className="space-y-4">
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                <h4 className="font-medium text-white mb-3">Creative Assets</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="headline" className="text-gray-300">Headline</Label>
                    <Input
                      id="headline"
                      value={formData.creative?.headline}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        creative: { ...prev.creative!, headline: e.target.value }
                      }))}
                      placeholder="Compelling headline..."
                      className=""
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-gray-300">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.creative?.description}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        creative: { ...prev.creative!, description: e.target.value }
                      }))}
                      placeholder="Detailed description of your offer..."
                      className="min-h-[100px] "
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="callToAction" className="text-gray-300">Call to Action</Label>
                    <Select 
                      value={formData.creative?.callToAction} 
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        creative: { ...prev.creative!, callToAction: value }
                      }))}
                    >
                      <SelectTrigger className="">
                        <SelectValue placeholder="Select CTA" />
                      </SelectTrigger>
                      <SelectContent>
                        {callToActions.map((cta) => (
                          <SelectItem key={cta} value={cta}>
                            {cta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* A/B Testing */}
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Switch
                    checked={formData.isABTesting}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isABTesting: checked }))}
                  />
                  <Label className="text-gray-300">Enable A/B Testing</Label>
                </div>
                {formData.isABTesting && (
                  <div className="text-sm text-gray-300">
                    A/B testing will automatically create variations of your creative to test performance.
                  </div>
                )}
              </div>

              {/* Conversion Tracking */}
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Switch
                    checked={formData.conversionTracking?.enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      conversionTracking: { ...prev.conversionTracking!, enabled: checked }
                    }))}
                  />
                  <Label className="text-gray-300">Conversion Tracking</Label>
                </div>
                {formData.conversionTracking?.enabled && (
                  <div>
                    <Input
                      placeholder="Pixel ID (optional)"
                      value={formData.conversionTracking.pixelId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        conversionTracking: { ...prev.conversionTracking!, pixelId: e.target.value }
                      }))}
                      className=""
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-gray-300">Campaign Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes about campaign strategy, goals, etc..."
                  className="min-h-[80px] "
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {campaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}