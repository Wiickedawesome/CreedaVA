import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

const statusConfig = {
  todo: { label: 'To Do', color: 'bg-gray-500', icon: Circle },
  in_progress: { label: 'In Progress', color: 'bg-blue-500', icon: Clock },
  blocked: { label: 'Blocked', color: 'bg-red-500', icon: AlertCircle },
  review: { label: 'Review', color: 'bg-purple-500', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-gray-400', icon: Circle }
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High', color: 'bg-emerald-100 text-emerald-800' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800' }
};

export function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<TaskInsert>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: null,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToSubmit = {
        ...formData,
        created_by: user?.id
      };

      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update(dataToSubmit)
          .eq('id', editingTask.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert([dataToSubmit as TaskInsert]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      estimated_hours: task.estimated_hours
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const updates: Partial<TaskInsert> = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: null,
    });
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header with Stats */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tasks</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Manage your tasks and to-dos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Tasks</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{taskStats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">To Do</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{taskStats.todo}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">In Progress</p>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{taskStats.inProgress}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">Completed</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">{taskStats.completed}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Overdue</p>
          <p className="text-3xl font-bold text-red-900 dark:text-red-100">{taskStats.overdue}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTask(null)}>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                <DialogDescription>
                  {editingTask ? 'Update task details below.' : 'Add a new task to your list.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Task title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Task description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as Task['status'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={formData.due_date ? new Date(formData.due_date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated_hours">Estimated Hours</Label>
                    <Input
                      id="estimated_hours"
                      type="number"
                      step="0.5"
                      value={formData.estimated_hours || ''}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || null })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Estimated</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {searchTerm ? 'No tasks found matching your search.' : 'No tasks yet. Create your first task to get started!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => {
                const StatusIcon = statusConfig[task.status as keyof typeof statusConfig].icon;
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={task.status || 'todo'}
                        onValueChange={(value) => handleStatusChange(task.id, value as Task['status'])}
                      >
                        <SelectTrigger className="w-32">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="w-4 h-4" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => {
                            const Icon = config.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  {config.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityConfig[task.priority as keyof typeof priorityConfig].color}>
                        {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <div className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          {format(new Date(task.due_date), 'MMM d, yyyy')}
                          {isOverdue && <Badge className="ml-2 bg-red-500">Overdue</Badge>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.estimated_hours ? `${task.estimated_hours}h` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(task.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(task)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
