import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Keyword {
  id?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

interface KeywordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keyword: Omit<Keyword, 'id'>) => void;
  keyword?: Keyword;
}

const categories = [
  'Primary Keywords',
  'Long-tail Keywords',
  'Brand Keywords',
  'Competitor Keywords',
  'Local SEO',
  'Product Keywords',
  'Content Keywords',
  'Seasonal Keywords'
];

const intentTypes = [
  { value: 'informational', label: 'Informational', description: 'Users seeking information' },
  { value: 'commercial', label: 'Commercial', description: 'Users researching products/services' },
  { value: 'transactional', label: 'Transactional', description: 'Users ready to buy' },
  { value: 'navigational', label: 'Navigational', description: 'Users looking for specific sites' }
];

export function KeywordDialog({ isOpen, onClose, onSave, keyword }: KeywordDialogProps) {
  const [formData, setFormData] = useState<Partial<Keyword>>({
    keyword: keyword?.keyword || '',
    category: keyword?.category || 'Primary Keywords',
    targetUrl: keyword?.targetUrl || '',
    currentRank: keyword?.currentRank || undefined,
    previousRank: keyword?.previousRank || undefined,
    searchVolume: keyword?.searchVolume || 0,
    difficulty: keyword?.difficulty || 0,
    cpc: keyword?.cpc || 0,
    intent: keyword?.intent || 'informational',
    competitors: keyword?.competitors || [],
    notes: keyword?.notes || '',
    isTracking: keyword?.isTracking ?? true,
    tags: keyword?.tags || [],
    rankHistory: keyword?.rankHistory || [],
    userId: 'admin' // Using admin as default for now
  });
  
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Initialize a single rank history entry for newly created keywords instead of random mocks
    if (!keyword && formData.currentRank) {
      formData.rankHistory = [
        {
          date: new Date().toISOString(),
          rank: formData.currentRank,
          searchVolume: formData.searchVolume || 0
        }
      ];
    }
    
    onSave(formData as Omit<Keyword, 'id'>);
    onClose();
  };

  const addCompetitor = () => {
    if (newCompetitor && !formData.competitors?.includes(newCompetitor)) {
      setFormData(prev => ({
        ...prev,
        competitors: [...(prev.competitors || []), newCompetitor]
      }));
      setNewCompetitor('');
    }
  };

  const removeCompetitor = (competitor: string) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors?.filter(c => c !== competitor) || []
    }));
  };

  const addTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  const getRankTrend = () => {
    if (!formData.currentRank || !formData.previousRank) return null;
    
    if (formData.currentRank < formData.previousRank) {
      return { icon: TrendingUp, color: 'text-green-600', text: 'Improved' };
    } else if (formData.currentRank > formData.previousRank) {
      return { icon: TrendingDown, color: 'text-red-600', text: 'Declined' };
    } else {
      return { icon: Minus, color: 'text-gray-400', text: 'No change' };
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 80) return 'text-red-600';
    if (difficulty >= 60) return 'text-yellow-600';
    if (difficulty >= 40) return 'text-blue-600';
    return 'text-green-600';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty >= 80) return 'Very Hard';
    if (difficulty >= 60) return 'Hard';
    if (difficulty >= 40) return 'Medium';
    return 'Easy';
  };

  const rankTrend = getRankTrend();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {keyword ? 'Edit Keyword' : 'Add New Keyword'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Track keyword rankings, analyze competition, and monitor SEO performance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyword" className="text-gray-300">Keyword</Label>
                <Input
                  id="keyword"
                  value={formData.keyword}
                  onChange={(e) => setFormData(prev => ({ ...prev, keyword: e.target.value }))}
                  placeholder="Enter keyword or phrase..."
                  className="border-gray-600"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-gray-300">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="border-gray-600">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetUrl" className="text-gray-300">Target URL</Label>
                <Input
                  id="targetUrl"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                  placeholder="https://example.com/target-page"
                  className="border-gray-600"
                  required
                />
              </div>

              <div>
                <Label htmlFor="intent" className="text-gray-300">Search Intent</Label>
                <Select value={formData.intent} onValueChange={(value: any) => setFormData(prev => ({ ...prev, intent: value }))}>
                  <SelectTrigger className="border-gray-600">
                    <SelectValue placeholder="Select search intent" />
                  </SelectTrigger>
                  <SelectContent>
                    {intentTypes.map((intent) => (
                      <SelectItem key={intent.value} value={intent.value}>
                        <div>
                          <div className="font-medium">{intent.label}</div>
                          <div className="text-sm text-gray-500">{intent.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ranking Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentRank" className="text-gray-300">Current Rank</Label>
                  <Input
                    id="currentRank"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.currentRank || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentRank: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="e.g., 15"
                    className="border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="previousRank" className="text-gray-300">Previous Rank</Label>
                  <Input
                    id="previousRank"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.previousRank || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, previousRank: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="e.g., 20"
                    className="border-gray-600"
                  />
                </div>
              </div>

              {rankTrend && (
                <div className="flex items-center space-x-2 p-3 bg-gray-800 border border-gray-700 rounded-lg">
                  <rankTrend.icon className={`w-4 h-4 ${rankTrend.color}`} />
                  <span className={`text-sm font-medium ${rankTrend.color}`}>
                    {rankTrend.text}
                  </span>
                  {formData.currentRank && formData.previousRank && (
                    <span className="text-sm text-gray-400">
                      ({Math.abs(formData.currentRank - formData.previousRank)} positions)
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isTracking}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isTracking: checked }))}
                />
                <Label className="text-gray-300">Active Tracking</Label>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* SEO Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="searchVolume" className="text-gray-300">Monthly Volume</Label>
                  <Input
                    id="searchVolume"
                    type="number"
                    min="0"
                    value={formData.searchVolume}
                    onChange={(e) => setFormData(prev => ({ ...prev, searchVolume: parseInt(e.target.value) || 0 }))}
                    placeholder="1000"
                    className="border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty" className="text-gray-300">Difficulty</Label>
                  <Input
                    id="difficulty"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: parseInt(e.target.value) || 0 }))}
                    placeholder="65"
                    className="border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="cpc" className="text-gray-300">CPC ($)</Label>
                  <Input
                    id="cpc"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cpc}
                    onChange={(e) => setFormData(prev => ({ ...prev, cpc: parseFloat(e.target.value) || 0 }))}
                    placeholder="2.50"
                    className="border-gray-600"
                  />
                </div>
              </div>

              {/* Difficulty Visualization */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-300">Keyword Difficulty</span>
                  <span className={`text-sm font-medium ${getDifficultyColor(formData.difficulty ?? 0)}`}>
                    {getDifficultyLabel(formData.difficulty ?? 0)} ({formData.difficulty ?? 0}/100)
                  </span>
                </div>
                <Progress value={formData.difficulty} className="h-2" />
              </div>

              {/* Competitors */}
              <div>
                <Label className="text-gray-300">Top Competitors</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    placeholder="competitor-domain.com"
                    className="flex-1 border-gray-600"
                  />
                  <Button type="button" onClick={addCompetitor}>Add</Button>
                </div>
                <div className="space-y-2 mt-2">
                  {formData.competitors?.map((competitor, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-800 border border-gray-700 rounded">
                      <span className="text-sm text-gray-300">{competitor}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCompetitor(competitor)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label className="text-gray-300">Tags</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value.replace(/[^a-zA-Z0-9\s]/g, ''))}
                    placeholder="tag name"
                    className="flex-1 border-gray-600"
                  />
                  <Button type="button" onClick={addTag}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags?.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-gray-300">Notes & Strategy</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes about optimization strategy, content plans, etc..."
                  className="min-h-[100px] border-gray-600"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {keyword ? 'Update Keyword' : 'Add Keyword'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}