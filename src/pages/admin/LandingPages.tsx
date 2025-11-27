import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Layout, BarChart2, Edit, Trash2 } from 'lucide-react';

type LandingPage = any;
const statusColors = { draft: 'bg-gray-500', active: 'bg-green-500', paused: 'bg-yellow-500' };

export function LandingPages() {
  const { user } = useAuth();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [formData, setFormData] = useState({ name: '', url_path: '', headline: '', cta_text: '', variant: 'A', status: 'draft' });

  useEffect(() => { fetchPages(); }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase.from('landing_pages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData, created_by: user?.id };
      if (editingPage) {
        const { error } = await supabase.from('landing_pages').update(dataToSubmit).eq('id', editingPage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_pages').insert([dataToSubmit]);
        if (error) throw error;
      }
      setIsDialogOpen(false);
      setEditingPage(null);
      setFormData({ name: '', url_path: '', headline: '', cta_text: '', variant: 'A', status: 'draft' });
      fetchPages();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const stats = { total: pages.length, active: pages.filter(p => p.status === 'active').length, avgConversion: pages.length > 0 ? (pages.reduce((sum, p) => sum + (p.conversion_rate || 0), 0) / pages.length).toFixed(2) : '0.00', totalVisits: pages.reduce((sum, p) => sum + (p.total_visits || 0), 0) };

  if (loading) return <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-white">Landing Pages</h1>
        <p className="text-gray-300 mt-2 font-medium">Manage pages and track conversions</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-indigo-600 p-4 rounded-lg border border-indigo-500">
          <p className="text-sm font-medium text-indigo-100">Total Pages</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg border border-green-500">
          <p className="text-sm font-medium text-green-100">Active</p>
          <p className="text-3xl font-bold text-white">{stats.active}</p>
        </div>
        <div className="bg-purple-600 p-4 rounded-lg border border-purple-500">
          <p className="text-sm font-medium text-purple-100">Avg Conversion</p>
          <p className="text-3xl font-bold text-white">{stats.avgConversion}%</p>
        </div>
        <div className="bg-emerald-600 p-4 rounded-lg border border-emerald-500">
          <p className="text-sm font-medium text-emerald-100">Total Visits</p>
          <p className="text-3xl font-bold text-white">{stats.totalVisits}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white w-4 h-4" /><Input placeholder="Search pages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-white" /></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button onClick={() => { setEditingPage(null); setFormData({ name: '', url_path: '', headline: '', cta_text: '', variant: 'A', status: 'draft' }); }}><Plus className="w-4 h-4 mr-2" />New Page</Button></DialogTrigger><DialogContent><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>{editingPage ? 'Edit' : 'Create'} Landing Page</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div className="space-y-2"><Label>URL Path *</Label><Input value={formData.url_path} onChange={(e) => setFormData({ ...formData, url_path: e.target.value })} placeholder="/landing/offer" required /></div><div className="space-y-2"><Label>Headline</Label><Input value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>CTA Text</Label><Input value={formData.cta_text} onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })} placeholder="Get Started" /></div><div className="space-y-2"><Label>Variant</Label><Select value={formData.variant} onValueChange={(value) => setFormData({ ...formData, variant: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">Variant A</SelectItem><SelectItem value="B">Variant B</SelectItem></SelectContent></Select></div></div><div className="space-y-2"><Label>Status *</Label><Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem></SelectContent></Select></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit">{editingPage ? 'Update' : 'Create'}</Button></DialogFooter></form></DialogContent></Dialog>
      </div>

      <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>URL Path</TableHead><TableHead>Variant</TableHead><TableHead>Status</TableHead><TableHead>Visits</TableHead><TableHead>Conversions</TableHead><TableHead>Rate</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{pages.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8"><div className="flex flex-col items-center gap-2"><Layout className="w-12 h-12 text-muted-foreground" /><p className="text-muted-foreground">No landing pages yet. Create your first!</p></div></TableCell></TableRow> : pages.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(page => <TableRow key={page.id}><TableCell className="font-medium">{page.name}</TableCell><TableCell className="text-sm text-muted-foreground">{page.url_path}</TableCell><TableCell><Badge variant="outline">Variant {page.variant}</Badge></TableCell><TableCell><Badge className={statusColors[page.status as keyof typeof statusColors]}>{page.status}</Badge></TableCell><TableCell>{page.total_visits || 0}</TableCell><TableCell>{page.conversions || 0}</TableCell><TableCell>{page.conversion_rate ? `${page.conversion_rate.toFixed(2)}%` : '0.00%'}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => { setEditingPage(page); setFormData({ name: page.name, url_path: page.url_path, headline: page.headline || '', cta_text: page.cta_text || '', variant: page.variant, status: page.status }); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="sm" onClick={async () => { if (confirm('Delete this page?')) { await supabase.from('landing_pages').delete().eq('id', page.id); fetchPages(); } }}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></TableCell></TableRow>)}</TableBody></Table>
    </div>
  );
}
