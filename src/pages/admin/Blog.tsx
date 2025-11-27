import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, FileText, Eye, Edit, Trash2, Star } from 'lucide-react';
import { format } from 'date-fns';

type BlogPost = any;
const statusColors = { draft: 'bg-gray-500', published: 'bg-green-500', archived: 'bg-red-500' };

export function Blog() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({ title: '', slug: '', excerpt: '', content: '', category: '', status: 'draft', is_featured: false });

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = formData.slug || generateSlug(formData.title);
      const dataToSubmit = { ...formData, slug, created_by: user?.id, published_at: formData.status === 'published' ? new Date().toISOString() : null, is_published: formData.status === 'published' };
      if (editingPost) {
        const { error } = await supabase.from('blog_posts').update(dataToSubmit).eq('id', editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blog_posts').insert([dataToSubmit]);
        if (error) throw error;
      }
      setIsDialogOpen(false);
      setEditingPost(null);
      setFormData({ title: '', slug: '', excerpt: '', content: '', category: '', status: 'draft', is_featured: false });
      fetchPosts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({ title: post.title, slug: post.slug, excerpt: post.excerpt || '', content: post.content, category: post.category || '', status: post.status, is_featured: post.is_featured });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      fetchPosts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const stats = { total: posts.length, published: posts.filter(p => p.status === 'published').length, drafts: posts.filter(p => p.status === 'draft').length, featured: posts.filter(p => p.is_featured).length };

  if (loading) return <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Blog & News</h1><p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Manage articles and company updates</p></div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-lg border border-purple-200 dark:border-purple-800"><p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Articles</p><p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.total}</p></div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg border border-green-200 dark:border-green-800"><p className="text-sm font-medium text-green-700 dark:text-green-300">Published</p><p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.published}</p></div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"><p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drafts</p><p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.drafts}</p></div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 p-4 rounded-lg border border-amber-200 dark:border-amber-800"><p className="text-sm font-medium text-amber-700 dark:text-amber-300">Featured</p><p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.featured}</p></div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" /><Input placeholder="Search articles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button onClick={() => { setEditingPost(null); setFormData({ title: '', slug: '', excerpt: '', content: '', category: '', status: 'draft', is_featured: false }); }}><Plus className="w-4 h-4 mr-2" />New Article</Button></DialogTrigger><DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>{editingPost ? 'Edit' : 'Create'} Blog Post</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Title *</Label><Input value={formData.title} onChange={(e) => { setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) }); }} required /></div><div className="space-y-2"><Label>Slug *</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required /></div></div><div className="space-y-2"><Label>Excerpt</Label><Textarea value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} rows={2} placeholder="Brief summary..." /></div><div className="space-y-2"><Label>Content *</Label><Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows={10} placeholder="Full article content..." /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Category</Label><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Company News, Tips" /></div><div className="space-y-2"><Label>Status *</Label><Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div></div><div className="flex items-center space-x-2"><Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} /><Label>Featured Article</Label></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit">{editingPost ? 'Update' : 'Create'}</Button></DialogFooter></form></DialogContent></Dialog>
      </div>

      <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead>Published</TableHead><TableHead>Views</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8"><div className="flex flex-col items-center gap-2"><FileText className="w-12 h-12 text-muted-foreground" /><p className="text-muted-foreground">No articles yet. Create your first blog post!</p></div></TableCell></TableRow> : posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map(post => <TableRow key={post.id}><TableCell><div className="flex items-center gap-2">{post.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}<div><p className="font-medium">{post.title}</p><p className="text-xs text-muted-foreground">/blog/{post.slug}</p></div></div></TableCell><TableCell>{post.category || '—'}</TableCell><TableCell><Badge className={statusColors[post.status as keyof typeof statusColors]}>{post.status}</Badge></TableCell><TableCell>{post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : '—'}</TableCell><TableCell><div className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views || 0}</div></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => handleEdit(post)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></TableCell></TableRow>)}</TableBody></Table>
    </div>
  );
}
