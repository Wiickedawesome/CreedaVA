import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Users, Target, TrendingUp, MapPin, Clock, Star } from 'lucide-react';

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

interface CustomerJourneyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CustomerJourney, 'id'>) => void;
  journey?: CustomerJourney;
}

const touchpointTypes = [
  { id: 'website', name: 'Website', icon: MapPin },
  { id: 'email', name: 'Email', icon: Target },
  { id: 'social', name: 'Social Media', icon: Users },
  { id: 'phone', name: 'Phone', icon: Clock },
  { id: 'inperson', name: 'In-Person', icon: Users },
  { id: 'app', name: 'Mobile App', icon: Target },
  { id: 'advertisement', name: 'Advertisement', icon: TrendingUp }
];

const emotions = [
  'Excited', 'Curious', 'Confused', 'Frustrated', 'Satisfied', 'Disappointed', 
  'Confident', 'Overwhelmed', 'Happy', 'Anxious', 'Impressed', 'Skeptical'
];

export function CustomerJourneyDialog({ isOpen, onClose, onSave, journey }: CustomerJourneyDialogProps) {
  const [formData, setFormData] = useState<Omit<CustomerJourney, 'id'>>({
    name: '',
    description: '',
    persona: {
      name: '',
      description: '',
      demographics: {
        age: '',
        location: '',
        occupation: '',
        income: ''
      },
      goals: [],
      painPoints: []
    },
    stages: [
      {
        id: '1',
        name: 'Awareness',
        description: 'Customer becomes aware of the problem or need',
        order: 1,
        touchpoints: [],
        metrics: {
          conversionRate: 0,
          dropOffRate: 0,
          avgTimeSpent: 0,
          satisfaction: 0
        }
      }
    ],
    funnel: {
      awareness: 100,
      consideration: 70,
      decision: 30,
      retention: 20,
      advocacy: 10
    },
    analytics: {
      totalUsers: 0,
      completionRate: 0,
      avgJourneyTime: 0,
      topExitPoints: []
    },
    optimizations: [],
    status: 'draft',
    userId: 'current-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [newGoal, setNewGoal] = useState('');
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newStage, setNewStage] = useState({ name: '', description: '' });
  const [newTouchpoint, setNewTouchpoint] = useState({ stageId: '', name: '', type: 'website', description: '' });

  useEffect(() => {
    if (journey) {
      setFormData(journey);
    }
  }, [journey]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (category: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category as keyof typeof prev] as any, [field]: value }
    }));
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        persona: {
          ...prev.persona,
          goals: [...prev.persona.goals, newGoal.trim()]
        }
      }));
      setNewGoal('');
    }
  };

  const addPainPoint = () => {
    if (newPainPoint.trim()) {
      setFormData(prev => ({
        ...prev,
        persona: {
          ...prev.persona,
          painPoints: [...prev.persona.painPoints, newPainPoint.trim()]
        }
      }));
      setNewPainPoint('');
    }
  };

  const addStage = () => {
    if (newStage.name.trim()) {
      const stage = {
        id: Date.now().toString(),
        name: newStage.name,
        description: newStage.description,
        order: formData.stages.length + 1,
        touchpoints: [],
        metrics: {
          conversionRate: 0,
          dropOffRate: 0,
          avgTimeSpent: 0,
          satisfaction: 0
        }
      };
      setFormData(prev => ({
        ...prev,
        stages: [...prev.stages, stage]
      }));
      setNewStage({ name: '', description: '' });
    }
  };

  const addTouchpoint = () => {
    if (newTouchpoint.name.trim() && newTouchpoint.stageId) {
      const touchpoint = {
        id: Date.now().toString(),
        name: newTouchpoint.name,
        type: newTouchpoint.type as any,
        description: newTouchpoint.description,
        emotions: [],
        actions: [],
        painPoints: [],
        opportunities: []
      };
      
      setFormData(prev => ({
        ...prev,
        stages: prev.stages.map(stage => 
          stage.id === newTouchpoint.stageId 
            ? { ...stage, touchpoints: [...stage.touchpoints, touchpoint] }
            : stage
        )
      }));
      setNewTouchpoint({ stageId: '', name: '', type: 'website', description: '' });
    }
  };

  const removeItem = (category: string, field: string, index: number) => {
    if (category === 'persona') {
      setFormData(prev => ({
        ...prev,
        persona: {
          ...prev.persona,
          [field]: Array.isArray(prev.persona[field as keyof typeof prev.persona]) 
          ? (prev.persona[field as keyof typeof prev.persona] as string[]).filter((_: any, i: number) => i !== index)
          : prev.persona[field as keyof typeof prev.persona]
        }
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    onSave(dataToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {journey ? 'Edit Customer Journey' : 'Create Customer Journey'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {journey ? 'Modify customer journey mapping and touchpoints.' : 'Map your customer journey with touchpoints, stages, and optimization opportunities.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-800">
              <TabsTrigger value="basic" className="data-[state=active]:bg-gray-700">Basic</TabsTrigger>
              <TabsTrigger value="persona" className="data-[state=active]:bg-gray-700">Persona</TabsTrigger>
              <TabsTrigger value="stages" className="data-[state=active]:bg-gray-700">Stages</TabsTrigger>
              <TabsTrigger value="funnel" className="data-[state=active]:bg-gray-700">Funnel</TabsTrigger>
              <TabsTrigger value="optimization" className="data-[state=active]:bg-gray-700">Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Journey Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="B2B Software Purchase Journey"
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Describe this customer journey and its objectives"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="persona" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Persona Name</Label>
                  <Input
                    value={formData.persona.name}
                    onChange={(e) => handleNestedInputChange('persona', 'name', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Tech-Savvy Business Owner"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Occupation</Label>
                  <Input
                    value={formData.persona.demographics.occupation}
                    onChange={(e) => handleNestedInputChange('persona', 'demographics', { ...formData.persona.demographics, occupation: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="CEO, Marketing Manager, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Persona Description</Label>
                <Textarea
                  value={formData.persona.description}
                  onChange={(e) => handleNestedInputChange('persona', 'description', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Detailed description of the customer persona"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Age Range</Label>
                  <Input
                    value={formData.persona.demographics.age}
                    onChange={(e) => handleNestedInputChange('persona', 'demographics', { ...formData.persona.demographics, age: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="25-35"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Location</Label>
                  <Input
                    value={formData.persona.demographics.location}
                    onChange={(e) => handleNestedInputChange('persona', 'demographics', { ...formData.persona.demographics, location: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Urban areas, US"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Income Range</Label>
                  <Input
                    value={formData.persona.demographics.income}
                    onChange={(e) => handleNestedInputChange('persona', 'demographics', { ...formData.persona.demographics, income: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="$50k-$100k"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Goals</Label>
                <div className="flex gap-2">
                  <Input
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Add a goal"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                  />
                  <Button type="button" onClick={addGoal} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.persona.goals.map((goal, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-700 text-white">
                      {goal}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem('persona', 'goals', index)}
                        className="ml-1 h-4 w-4 p-0 hover:bg-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Pain Points</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPainPoint}
                    onChange={(e) => setNewPainPoint(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Add a pain point"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPainPoint())}
                  />
                  <Button type="button" onClick={addPainPoint} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.persona.painPoints.map((pain, index) => (
                    <Badge key={index} variant="secondary" className="bg-red-700 text-white">
                      {pain}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem('persona', 'painPoints', index)}
                        className="ml-1 h-4 w-4 p-0 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stages" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Journey Stages
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Define the stages of your customer journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      value={newStage.name}
                      onChange={(e) => setNewStage(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Stage name"
                    />
                    <Input
                      value={newStage.description}
                      onChange={(e) => setNewStage(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Stage description"
                    />
                    <Button
                      type="button"
                      onClick={addStage}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Stage
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {formData.stages.map((stage) => (
                      <div key={stage.id} className="p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium text-white">{stage.name}</div>
                            <div className="text-sm text-gray-400">{stage.description}</div>
                          </div>
                          <Badge variant="secondary" className="bg-gray-600 text-white">
                            {stage.touchpoints.length} touchpoints
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Add Touchpoint</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select 
                      value={newTouchpoint.stageId} 
                      onValueChange={(value) => setNewTouchpoint(prev => ({ ...prev, stageId: value }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.stages.map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={newTouchpoint.type} 
                      onValueChange={(value) => setNewTouchpoint(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {touchpointTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      value={newTouchpoint.name}
                      onChange={(e) => setNewTouchpoint(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Touchpoint name"
                    />
                    <Input
                      value={newTouchpoint.description}
                      onChange={(e) => setNewTouchpoint(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Description"
                    />
                    <Button
                      type="button"
                      onClick={addTouchpoint}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Touchpoint
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="funnel" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Conversion Funnel</CardTitle>
                  <CardDescription className="text-gray-400">
                    Set the percentage of users at each stage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Awareness</Label>
                      <Input
                        type="number"
                        value={formData.funnel.awareness}
                        onChange={(e) => handleNestedInputChange('funnel', 'awareness', Number(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                        min="0" max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Consideration</Label>
                      <Input
                        type="number"
                        value={formData.funnel.consideration}
                        onChange={(e) => handleNestedInputChange('funnel', 'consideration', Number(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                        min="0" max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Decision</Label>
                      <Input
                        type="number"
                        value={formData.funnel.decision}
                        onChange={(e) => handleNestedInputChange('funnel', 'decision', Number(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                        min="0" max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Retention</Label>
                      <Input
                        type="number"
                        value={formData.funnel.retention}
                        onChange={(e) => handleNestedInputChange('funnel', 'retention', Number(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                        min="0" max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Advocacy</Label>
                      <Input
                        type="number"
                        value={formData.funnel.advocacy}
                        onChange={(e) => handleNestedInputChange('funnel', 'advocacy', Number(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                        min="0" max="100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Analytics Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">{formData.analytics.totalUsers.toLocaleString()}</div>
                      <div className="text-gray-400">Total Users</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{formData.analytics.completionRate.toFixed(1)}%</div>
                      <div className="text-gray-400">Completion Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{Math.floor(formData.analytics.avgJourneyTime / 60)}m</div>
                      <div className="text-gray-400">Avg Journey Time</div>
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
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {journey ? 'Update Journey' : 'Create Journey'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}