import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckSquare, Calendar as CalendarIcon, User, Flag, Clock, Tag, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['todo', 'in-progress', 'review', 'completed', 'cancelled']),
  category: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  dueDate: z.date().optional(),
  tags: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export interface Task {
  id: string;
  type: string;
  title: string;
  description?: string;
  assignedTo?: string;
  priority: string;
  status: string;
  category?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  tags?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSave: (task: TaskFormData) => Promise<void>;
  mode: 'create' | 'edit' | 'view';
}

const taskPriorities = [
  { value: 'low', label: 'Low Priority', color: 'bg-gray-500', textColor: 'text-gray-400' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { value: 'high', label: 'High Priority', color: 'bg-orange-500', textColor: 'text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-400' },
];

const taskStatuses = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'review', label: 'Under Review', color: 'bg-purple-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

const taskCategories = [
  'General',
  'Client Work',
  'Marketing',
  'Development',
  'Design',
  'Content Creation',
  'Admin',
  'Research',
  'Planning',
  'Meeting',
  'Other'
];

export function TaskDialog({ open, onOpenChange, task, onSave, mode }: TaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      assignedTo: task?.assignedTo || '',
      priority: (task?.priority as any) || 'medium',
      status: (task?.status as any) || 'todo',
      category: task?.category || '',
      estimatedHours: task?.estimatedHours || 0,
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      tags: task?.tags || '',
    },
  });

  // Reset form when task changes
  useState(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        assignedTo: task.assignedTo || '',
        priority: task.priority as any,
        status: task.status as any,
        category: task.category || '',
        estimatedHours: task.estimatedHours || 0,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        tags: task.tags || '',
      });
    } else {
      form.reset({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        status: 'todo',
        category: '',
        estimatedHours: 0,
        dueDate: undefined,
        tags: '',
      });
    }
  }, [task, open]);

  const handleSubmit = async (data: TaskFormData) => {
    try {
      setLoading(true);
      await onSave(data);
      onOpenChange(false);
      if (mode === 'create') {
        form.reset();
      }
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';
  const title = mode === 'create' ? 'Create New Task' : mode === 'edit' ? 'Edit Task' : 'Task Details';
  const description = mode === 'create' 
    ? 'Create a new task with details and assignment' 
    : mode === 'edit' 
    ? 'Update task information and status'
    : 'View detailed task information and progress';

  const getPriorityInfo = (priority: string) => {
    return taskPriorities.find(p => p.value === priority) || taskPriorities[1];
  };

  const getStatusInfo = (status: string) => {
    return taskStatuses.find(s => s.value === status) || taskStatuses[0];
  };

  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <CheckSquare className="h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">{description}</DialogDescription>
        </DialogHeader>

        {mode === 'view' ? (
          <div className="space-y-6">
            {/* Task Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Flag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Priority</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Flag className={`h-5 w-5 ${getPriorityInfo(task?.priority || '').textColor}`} />
                  <Badge className={`${getPriorityInfo(task?.priority || '').color} text-white`}>
                    {getPriorityInfo(task?.priority || '').label}
                  </Badge>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Status</span>
                </div>
                <Badge className={`${getStatusInfo(task?.status || '').color} text-white`}>
                  {getStatusInfo(task?.status || '').label}
                </Badge>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Estimated Time</span>
                </div>
                <p className="text-white font-medium">
                  {task?.estimatedHours || 0}h
                  {task?.actualHours && ` / ${task.actualHours}h actual`}
                </p>
              </div>
            </div>

            {/* Task Details */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <CheckSquare className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Title</span>
              </div>
              <h3 className="text-xl font-semibold text-white">{task?.title}</h3>
            </div>

            {task?.description && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-sm font-medium text-gray-300">Description</span>
                </div>
                <p className="text-gray-100 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Assignment and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Assigned To</span>
                </div>
                <p className="font-medium text-white">{task?.assignedTo || 'Unassigned'}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Category</span>
                </div>
                <p className="font-medium text-white">{task?.category || 'General'}</p>
              </div>
            </div>

            {/* Due Date and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Due Date</span>
                </div>
                <div className="flex items-center space-x-2">
                  <p className={cn("font-medium", isOverdue ? "text-red-400" : "text-white")}>
                    {task?.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </p>
                  {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {task?.tags ? (
                    task.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">No tags</span>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Timeline</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Created: {task?.createdAt && new Date(task.createdAt).toLocaleString()}
                </p>
                {task?.updatedAt && (
                  <p className="text-sm text-gray-400">
                    Last Updated: {new Date(task.updatedAt).toLocaleString()}
                  </p>
                )}
                {task?.completedAt && (
                  <p className="text-sm text-green-400">
                    Completed: {new Date(task.completedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter task title"
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter task description..."
                        className="min-h-[100px]"
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assignment and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter assignee name"
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {taskCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Priority and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {taskPriorities.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {taskStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Time and Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Hours</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="0"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isReadOnly}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setDatePickerOpen(false);
                            }}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma separated)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="urgent, client-work, review"
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {mode !== 'view' && (
            <Button type="submit" onClick={form.handleSubmit(handleSubmit)} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Task' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}