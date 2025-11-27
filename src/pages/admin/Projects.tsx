import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

const statusConfig = {
  planning: { label: 'Planning', color: 'bg-blue-500' },
  active: { label: 'Active', color: 'bg-green-500' },
  on_hold: { label: 'On Hold', color: 'bg-yellow-500' },
  completed: { label: 'Completed', color: 'bg-purple-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
  archived: { label: 'Archived', color: 'bg-gray-500' }
};

const healthConfig = {
  on_track: { label: 'On Track', icon: CheckCircle, color: 'text-green-600' },
  at_risk: { label: 'At Risk', icon: AlertTriangle, color: 'text-yellow-600' },
  off_track: { label: 'Off Track', icon: AlertTriangle, color: 'text-red-600' }
};

export function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<ProjectInsert>>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    budget: null,
    progress_percentage: 0
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData, project_manager: user?.id };
      if (editingProject) {
        const { error } = await supabase.from('projects').update(dataToSubmit).eq('id', editingProject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('projects').insert([dataToSubmit as ProjectInsert]);
        if (error) throw error;
      }
      handleCloseDialog();
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({ name: project.name, description: project.description, status: project.status, priority: project.priority, budget: project.budget, start_date: project.start_date, end_date: project.end_date, progress_percentage: project.progress_percentage, health_status: project.health_status });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
    setFormData({ name: '', description: '', status: 'planning', priority: 'medium', budget: null, progress_percentage: 0 });
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const stats = { total: projects.length, active: projects.filter(p => p.status === 'active').length, completed: projects.filter(p => p.status === 'completed').length };

  if (loading) return <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="p-8 space-y-6 min-h-screen">
      <div><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projects</h1><p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Manage client projects</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6"><div className="text-sm font-medium text-gray-600">Total Projects</div><div className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm font-medium text-gray-600">Active</div><div className="text-2xl font-bold text-gray-900 mt-2">{stats.active}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm font-medium text-gray-600">Completed</div><div className="text-2xl font-bold text-gray-900 mt-2">{stats.completed}</div></CardContent></Card>
      </div>
      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button onClick={() => setEditingProject(null)}><Plus className="w-4 h-4 mr-2" />New Project</Button></DialogTrigger><DialogContent className="sm:max-w-[600px]"><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>{editingProject ? 'Edit' : 'New'} Project</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div className="space-y-2"><Label>Description</Label><Textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Project['status'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusConfig).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Progress %</Label><Input type="number" min="0" max="100" value={formData.progress_percentage || 0} onChange={(e) => setFormData({ ...formData, progress_percentage: parseInt(e.target.value) || 0 })} /></div></div></div><DialogFooter><Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button><Button type="submit">{editingProject ? 'Update' : 'Create'}</Button></DialogFooter></form></DialogContent></Dialog>
      </div>
      <Table><TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Status</TableHead><TableHead>Progress</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filteredProjects.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No projects yet</TableCell></TableRow> : filteredProjects.map(p => <TableRow key={p.id}><TableCell><div className="font-medium">{p.name}</div></TableCell><TableCell><Badge className={statusConfig[p.status as keyof typeof statusConfig].color}>{statusConfig[p.status as keyof typeof statusConfig].label}</Badge></TableCell><TableCell><div className="space-y-1 min-w-[100px]"><div className="text-sm">{p.progress_percentage}%</div><Progress value={p.progress_percentage || 0} className="h-2" /></div></TableCell><TableCell className="text-muted-foreground">{format(new Date(p.created_at), 'MMM d, yyyy')}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></TableCell></TableRow>)}</TableBody></Table>
    </div>
  );
}
