import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, TrendingUp, TrendingDown, Minus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

type Keyword = Database['public']['Tables']['keyword_tracking']['Row'];
type KeywordInsert = Database['public']['Tables']['keyword_tracking']['Insert'];

export function Keywords() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [formData, setFormData] = useState<Partial<KeywordInsert>>({ keyword: '', target_url: '', search_volume: null, difficulty: null });

  useEffect(() => { fetchKeywords(); }, []);

  const fetchKeywords = async () => {
    try {
      const { data, error } = await supabase.from('keyword_tracking').select('*').order('search_volume', { ascending: false, nullsFirst: false });
      if (error) throw error;
      setKeywords(data || []);
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKeyword) {
        const { error } = await supabase.from('keyword_tracking').update(formData).eq('id', editingKeyword.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('keyword_tracking').insert([formData as KeywordInsert]);
        if (error) throw error;
      }
      setIsDialogOpen(false);
      setEditingKeyword(null);
      setFormData({ keyword: '', target_url: '', search_volume: null, difficulty: null });
      fetchKeywords();
    } catch (error) {
      console.error('Error saving keyword:', error);
    }
  };

  const handleEdit = (keyword: Keyword) => {
    setEditingKeyword(keyword);
    setFormData({ keyword: keyword.keyword, target_url: keyword.target_url, search_volume: keyword.search_volume, difficulty: keyword.difficulty, current_position: keyword.current_position });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete keyword?')) return;
    try {
      const { error } = await supabase.from('keyword_tracking').delete().eq('id', id);
      if (error) throw error;
      fetchKeywords();
    } catch (error) {
      console.error('Error deleting keyword:', error);
    }
  };

  const filteredKeywords = keywords.filter(k => k.keyword.toLowerCase().includes(searchTerm.toLowerCase()));
  const stats = { total: keywords.length, ranked: keywords.filter(k => k.current_position && k.current_position <= 10).length, avgPosition: keywords.filter(k => k.current_position).reduce((sum, k) => sum + (k.current_position || 0), 0) / (keywords.filter(k => k.current_position).length || 1) };

  const getPositionTrend = (current: number | null, previous: number | null) => {
    if (!current || !previous) return <Minus className="w-4 h-4 text-gray-400" />;
    if (current < previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current > previous) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  if (loading) return <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-white">Keyword Tracking</h1>
        <p className="text-gray-300 mt-2 font-medium">Monitor search rankings and SEO performance</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-violet-600 p-4 rounded-lg border border-violet-500">
          <p className="text-sm font-medium text-violet-100">Total Keywords</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-emerald-600 p-4 rounded-lg border border-emerald-500">
          <p className="text-sm font-medium text-emerald-100">Top 10</p>
          <p className="text-3xl font-bold text-white">{stats.ranked}</p>
        </div>
        <div className="bg-cyan-600 p-4 rounded-lg border border-cyan-500">
          <p className="text-sm font-medium text-cyan-100">Avg Position</p>
          <p className="text-3xl font-bold text-white">{stats.avgPosition.toFixed(1)}</p>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button onClick={() => { setEditingKeyword(null); setFormData({ keyword: '', target_url: '', search_volume: null, difficulty: null }); }}><Plus className="w-4 h-4 mr-2" />Add Keyword</Button></DialogTrigger><DialogContent><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>{editingKeyword ? 'Edit' : 'Add'} Keyword</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label>Keyword *</Label><Input value={formData.keyword} onChange={(e) => setFormData({ ...formData, keyword: e.target.value })} required /></div><div className="space-y-2"><Label>Target URL *</Label><Input value={formData.target_url} onChange={(e) => setFormData({ ...formData, target_url: e.target.value })} required type="url" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Search Volume</Label><Input type="number" value={formData.search_volume || ''} onChange={(e) => setFormData({ ...formData, search_volume: parseInt(e.target.value) || null })} /></div><div className="space-y-2"><Label>Difficulty (0-100)</Label><Input type="number" min="0" max="100" value={formData.difficulty || ''} onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) || null })} /></div></div><div className="space-y-2"><Label>Current Position</Label><Input type="number" min="1" value={formData.current_position || ''} onChange={(e) => setFormData({ ...formData, current_position: parseInt(e.target.value) || null })} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit">{editingKeyword ? 'Update' : 'Add'}</Button></DialogFooter></form></DialogContent></Dialog>
      </div>
      <Table><TableHeader><TableRow><TableHead>Keyword</TableHead><TableHead>Position</TableHead><TableHead>Trend</TableHead><TableHead>Volume</TableHead><TableHead>Difficulty</TableHead><TableHead>Clicks</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filteredKeywords.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No keywords yet</TableCell></TableRow> : filteredKeywords.map(k => <TableRow key={k.id}><TableCell><div className="font-medium">{k.keyword}</div><div className="text-xs text-muted-foreground line-clamp-1">{k.target_url}</div></TableCell><TableCell><Badge variant="outline" className={k.current_position && k.current_position <= 3 ? 'border-green-500 text-green-700' : k.current_position && k.current_position <= 10 ? 'border-blue-500 text-blue-700' : ''}>{k.current_position || '—'}</Badge></TableCell><TableCell>{getPositionTrend(k.current_position, k.previous_position)}</TableCell><TableCell>{k.search_volume?.toLocaleString() || '—'}</TableCell><TableCell>{k.difficulty ? <Badge variant="outline" className={k.difficulty < 30 ? 'border-green-500' : k.difficulty < 60 ? 'border-yellow-500' : 'border-red-500'}>{k.difficulty}</Badge> : '—'}</TableCell><TableCell>{k.clicks || 0}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => handleEdit(k)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(k.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></TableCell></TableRow>)}</TableBody></Table>
    </div>
  );
}
