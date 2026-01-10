import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/admin/PageLayout';
import { ProjectDialog, Project } from '@/components/admin/ProjectDialog';
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
  FolderKanban, 
  Plus, 
  RefreshCw, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Target, 
  Users, 
  Calendar, 
  DollarSign,
  Percent 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type ProjectFormData = {
  name: string;
  description?: string;
  status: string;
  priority: string;
  manager?: string;
  team?: string;
  budget?: number;
  progress: number;
  startDate?: Date;
  endDate?: Date;
  milestones?: string;
  tags?: string;
  category?: string;
};

const projectStatuses = [
  { value: 'planning', label: 'Planning', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { value: 'active', label: 'Active', color: 'bg-green-500', textColor: 'text-green-400' },
  { value: 'on-hold', label: 'On Hold', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-500', textColor: 'text-purple-400' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-400' },
];

const projectPriorities = [
  { value: 'low', label: 'Low', color: 'bg-gray-500', textColor: 'text-gray-400' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { value: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-400' },
];

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authorizedFetch(`${API_BASE}/getProjects`);
      
      if (response.ok) {
        const result = await response.json();
        setProjects(result.data || []);
      } else {
        throw new Error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (dialogMode === 'create') {
        const response = await authorizedFetch(`${API_BASE}/createProjects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData)
        });
        
        if (response.ok) {
          await fetchProjects();
        } else {
          throw new Error('Failed to create project');
        }
      } else if (dialogMode === 'edit' && selectedProject) {
        const response = await authorizedFetch(`${API_BASE}/updateProjects/${selectedProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData)
        });
        
        if (response.ok) {
          await fetchProjects();
        } else {
          throw new Error('Failed to update project');
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setError('Failed to save project. Please try again.');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const response = await authorizedFetch(`${API_BASE}/deleteProjects/${projectToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchProjects();
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project. Please try again.');
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.manager?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = projectStatuses.find(s => s.value === status);
    if (!statusConfig) return null;
    
    return (
      <Badge className={cn("px-2 py-1 text-xs font-medium rounded-full", statusConfig.color)}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = projectPriorities.find(p => p.value === priority);
    if (!priorityConfig) return null;
    
    return (
      <Badge variant="outline" className={cn("px-2 py-1 text-xs font-medium", priorityConfig.textColor)}>
        {priorityConfig.label}
      </Badge>
    );
  };

  return (
    <>
      <PageLayout
        title="Projects"
        description="Manage project timelines, milestones, and team assignments"
        searchPlaceholder="Search projects..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        primaryAction={{
          label: 'Create Project',
          onClick: handleCreateProject,
          icon: <Plus className="h-4 w-4" />
        }}
        secondaryActions={[
          {
            label: 'Refresh',
            onClick: fetchProjects,
            icon: <RefreshCw className="h-4 w-4" />
          }
        ]}
      >
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading projects...</p>
          </div>
        ) : error ? (
          <ErrorPanel message={error} onRetry={fetchProjects} />
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Project</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Priority</TableHead>
                  <TableHead className="text-gray-300">Progress</TableHead>
                  <TableHead className="text-gray-300">Manager</TableHead>
                  <TableHead className="text-gray-300">Timeline</TableHead>
                  <TableHead className="text-gray-300">Budget</TableHead>
                  <TableHead className="text-gray-300 w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg mb-2">No projects found</p>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first project'}
                      </p>
                      {!searchTerm && (
                        <Button onClick={handleCreateProject} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Project
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project) => {
                    const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== 'completed';
                    
                    return (
                      <TableRow key={project.id} className="border-gray-700 hover:bg-gray-750">
                        <TableCell>
                          <div>
                            <div className="font-medium text-white">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-gray-400 truncate max-w-xs">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(project.status)}
                            {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(project.priority)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-2 w-16">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all" 
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-white text-sm font-medium">{project.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-white">{project.manager || 'Unassigned'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-300 text-sm">
                            {project.startDate && project.endDate ? (
                              `${format(new Date(project.startDate), 'MMM dd')} - ${format(new Date(project.endDate), 'MMM dd')}`
                            ) : (
                              'Not set'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-white">
                            {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                              <DropdownMenuItem onClick={() => handleViewProject(project)} className="text-gray-300 hover:bg-gray-700">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditProject(project)} className="text-gray-300 hover:bg-gray-700">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Project
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setProjectToDelete(project);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-400 hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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

      {/* Project Dialog */}
      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={selectedProject}
        onSave={handleSaveProject}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
