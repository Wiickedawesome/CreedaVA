import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarIcon, Clock, Users, Target, Percent, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface Project {
  id: string;
  type: 'project';
  name: string;
  description?: string;
  status: string;
  priority: string;
  manager?: string;
  team?: string;
  budget?: number;
  progress: number;
  startDate?: string;
  endDate?: string;
  milestones?: string;
  tags?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSave: (project: Omit<Project, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => void;
  mode: 'create' | 'edit' | 'view';
}

const projectStatuses = [
  { value: 'planning', label: 'Planning', color: 'bg-blue-500' },
  { value: 'active', label: 'Active', color: 'bg-green-500' },
  { value: 'on-hold', label: 'On Hold', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

const projectPriorities = [
  { value: 'low', label: 'Low', color: 'bg-gray-500', textColor: 'text-gray-400' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { value: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-400' },
];

const projectCategories = [
  { value: 'development', label: 'Development' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'operations', label: 'Operations' },
  { value: 'client-work', label: 'Client Work' },
];

export function ProjectDialog({ open, onOpenChange, project, onSave, mode }: ProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    manager: '',
    team: '',
    budget: 0,
    progress: 0,
    startDate: '',
    endDate: '',
    milestones: '',
    tags: '',
    category: 'development',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        manager: project.manager || '',
        team: project.team || '',
        budget: project.budget || 0,
        progress: project.progress || 0,
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        milestones: project.milestones || '',
        tags: project.tags || '',
        category: project.category || 'development',
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        manager: '',
        team: '',
        budget: 0,
        progress: 0,
        startDate: '',
        endDate: '',
        milestones: '',
        tags: '',
        category: 'development',
      });
    }
    setErrors({});
  }, [project, mode, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = 'Progress must be between 0 and 100';
    }

    if (formData.budget && formData.budget < 0) {
      newErrors.budget = 'Budget must be positive';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        manager: formData.manager,
        team: formData.team,
        budget: formData.budget,
        progress: formData.progress,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        milestones: formData.milestones,
        tags: formData.tags,
        category: formData.category,
        completedAt: formData.status === 'completed' ? new Date().toISOString() : undefined,
      });
      onOpenChange(false);
    }
  };

  const isOverdue = project?.endDate && new Date(project.endDate) < new Date() && project.status !== 'completed';
  const isReadOnly = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {mode === 'create' ? 'Create New Project' : mode === 'edit' ? 'Edit Project' : 'Project Details'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {mode === 'create'
              ? 'Add a new project with timeline and team assignments'
              : mode === 'edit'
              ? 'Update project information and progress'
              : 'View project details and progress'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'view' && project && (
          <div className="space-y-6">
            {/* Project Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Status</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      projectStatuses.find(s => s.value === project.status)?.color || 'bg-gray-500'
                    )}
                  >
                    {projectStatuses.find(s => s.value === project.status)?.label || project.status}
                  </Badge>
                  {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Percent className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-medium">{project.progress}%</span>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Timeline</span>
                </div>
                <div>
                  <p className="text-white text-sm">
                    {project.startDate ? format(new Date(project.startDate), 'MMM dd') : 'No start'} - {project.endDate ? format(new Date(project.endDate), 'MMM dd') : 'No end'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Budget</span>
                </div>
                <p className="text-white font-medium">
                  ${project.budget ? project.budget.toLocaleString() : 'Not set'}
                </p>
              </div>
            </div>

            {/* Project Details */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Description</Label>
                  <p className="text-gray-400 mt-1">{project.description || 'No description provided'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Project Manager</Label>
                    <p className="text-white mt-1">{project.manager || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Team</Label>
                    <p className="text-white mt-1">{project.team || 'Not specified'}</p>
                  </div>
                </div>

                {project.milestones && (
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Milestones</Label>
                    <p className="text-gray-400 mt-1">{project.milestones}</p>
                  </div>
                )}

                {project.tags && (
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.tags.split(',').map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-gray-300 border-gray-600">
                          {tag.trim()}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Project Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project name"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} disabled={isReadOnly}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {projectCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value} className="text-white">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description and objectives"
                rows={3}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })} disabled={isReadOnly}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {projectStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value} className="text-white">
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })} disabled={isReadOnly}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {projectPriorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value} className="text-white">
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Progress (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-600 text-white"
                  disabled={isReadOnly}
                />
                {errors.progress && <p className="text-red-400 text-xs mt-1">{errors.progress}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Project Manager</Label>
                <Input
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="Assigned project manager"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Team</Label>
                <Input
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  placeholder="Team members"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Budget ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                  placeholder="Project budget"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
                {errors.budget && <p className="text-red-400 text-xs mt-1">{errors.budget}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                  disabled={isReadOnly}
                />
                {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate}</p>}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Milestones</Label>
              <Textarea
                value={formData.milestones}
                onChange={(e) => setFormData({ ...formData, milestones: e.target.value })}
                placeholder="Key milestones and deliverables"
                rows={2}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={isReadOnly}
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Tags</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Comma-separated tags (e.g., frontend, mobile, api)"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={isReadOnly}
              />
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
              {mode === 'create' ? 'Create Project' : 'Save Changes'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}