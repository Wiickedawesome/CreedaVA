import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/admin/PageLayout';
import { TaskDialog, Task } from '@/components/admin/TaskDialog';
import { API_BASE, authorizedFetch } from '@/lib/api-client';
import { ErrorPanel } from '@/components/ErrorPanel'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  CheckSquare, 
  Plus, 
  RefreshCw, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Flag, 
  User, 
  Calendar, 
  Clock,
  Target 
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskFormData = {
  title: string;
  description?: string;
  assignedTo?: string;
  priority: string;
  status: string;
  category?: string;
  estimatedHours?: number;
  dueDate?: Date;
  tags?: string;
};

const taskPriorities = [
  { value: 'low', label: 'Low', color: 'bg-gray-500', textColor: 'text-gray-400' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { value: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-400' },
];

const taskStatuses = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'review', label: 'Review', color: 'bg-purple-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authorizedFetch(`${API_BASE}/getTasks`);
      
      if (response.ok) {
        const result = await response.json();
        setTasks(result.data || []);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (taskData: TaskFormData) => {
    try {
      if (dialogMode === 'create') {
        const response = await authorizedFetch(`${API_BASE}/createTasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...taskData,
            dueDate: taskData.dueDate?.toISOString(),
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create task');
        }
      } else if (dialogMode === 'edit' && selectedTask) {
        const response = await authorizedFetch(`${API_BASE}/updateTasks/${selectedTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...taskData,
            dueDate: taskData.dueDate?.toISOString(),
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update task');
        }
      }
      
      // Refresh tasks after save
      await fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      const response = await authorizedFetch(`${API_BASE}/deleteTasks/${taskToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      
      // Refresh tasks after delete
      await fetchTasks();
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.tags?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const confirmDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const getPriorityInfo = (priority: string) => {
    return taskPriorities.find(p => p.value === priority) || taskPriorities[1];
  };

  const getStatusInfo = (status: string) => {
    return taskStatuses.find(s => s.value === status) || taskStatuses[0];
  };

  const isOverdue = (task: Task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  };

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const overdueTasks = tasks.filter(task => isOverdue(task)).length;

  return (
    <>
      <PageLayout
        title="Tasks"
        description="Task management and tracking"
        searchPlaceholder="Search tasks..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        stats={[
          { label: 'total tasks', value: totalTasks },
          { label: 'completed', value: completedTasks },
          { label: 'in progress', value: inProgressTasks },
          { label: 'overdue', value: overdueTasks }
        ]}
        secondaryActions={[
          {
            label: 'Refresh',
            onClick: fetchTasks,
            variant: 'outline',
            icon: <RefreshCw className="h-4 w-4" />
          }
        ]}
        primaryAction={{
          label: 'Create Task',
          onClick: handleCreateTask,
          icon: <Plus className="h-4 w-4" />
        }}
      >
        {loading ? (
          <div className="text-center py-8 text-gray-300">Loading tasks...</div>
        ) : error ? (
          <ErrorPanel message={error} onRetry={fetchTasks} />
        ) : (
          <div className="bg-gray-900 rounded-lg border border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Task</TableHead>
                  <TableHead className="text-gray-300">Assigned</TableHead>
                  <TableHead className="text-gray-300">Priority</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Category</TableHead>
                  <TableHead className="text-gray-300">Due Date</TableHead>
                  <TableHead className="text-gray-300">Time</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow className="border-gray-700">
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                      {searchTerm ? 'No tasks found matching your search' : 'No tasks found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => {
                    const priorityInfo = getPriorityInfo(task.priority);
                    const statusInfo = getStatusInfo(task.status);
                    const overdueTask = isOverdue(task);
                    
                    return (
                      <TableRow key={task.id} className="border-gray-700 hover:bg-gray-800">
                        <TableCell>
                          <div>
                            <p className={cn("font-medium", overdueTask ? "text-red-400" : "text-gray-200")}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-sm text-gray-400 truncate max-w-xs">
                                {task.description}
                              </p>
                            )}
                            {task.tags && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {task.tags.split(',').slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag.trim()}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">{task.assignedTo || 'Unassigned'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Flag className={`h-4 w-4 ${priorityInfo.textColor}`} />
                            <Badge className={`${priorityInfo.color} text-white`}>
                              {priorityInfo.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusInfo.color} text-white`}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-300">{task.category || 'General'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className={cn(
                              "text-sm",
                              overdueTask ? "text-red-400" : "text-gray-400"
                            )}>
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                            </span>
                            {overdueTask && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              {task.estimatedHours || 0}h
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                              <DropdownMenuItem 
                                onClick={() => handleViewTask(task)}
                                className="text-gray-300 hover:bg-gray-700"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEditTask(task)}
                                className="text-gray-300 hover:bg-gray-700"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => confirmDeleteTask(task)}
                                className="text-red-400 hover:bg-gray-700"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </PageLayout>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        onSave={handleSaveTask}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}