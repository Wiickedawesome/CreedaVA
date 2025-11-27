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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Linkedin, Twitter, Facebook, Instagram, Calendar, TrendingUp, Heart, MessageCircle, Share2 } from 'lucide-react';
import { format } from 'date-fns';

type SocialPost = any;

const platformIcons = { linkedin: Linkedin, twitter: Twitter, facebook: Facebook, instagram: Instagram };
const statusColors = { draft: 'bg-gray-500', scheduled: 'bg-blue-500', published: 'bg-green-500', failed: 'bg-red-500' };

export function Social() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ content: '', platform: 'linkedin', status: 'draft', scheduled_for: '', hashtags: '' });

  useEffect(() => { fetchPosts(); }, [selectedPlatform]);

  const fetchPosts = async () => {
    try {
      let query = supabase.from('social_posts').select('*').order('created_at', { ascending: false });
      if (selectedPlatform !== 'all') query = query.eq('platform', selectedPlatform);
      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData, created_by: user?.id, hashtags: formData.hashtags.split(' ').filter(Boolean) };
      const { error } = await supabase.from('social_posts').insert([dataToSubmit]);
      if (error) throw error;
      setIsDialogOpen(false);
      setFormData({ content: '', platform: 'linkedin', status: 'draft', scheduled_for: '', hashtags: '' });
      fetchPosts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const stats = { total: posts.length, linkedin: posts.filter(p => p.platform === 'linkedin').length, scheduled: posts.filter(p => p.status === 'scheduled').length, published: posts.filter(p => p.status === 'published').length, totalEngagement: posts.reduce((sum, p) => sum + ((p.likes || 0) + (p.comments || 0) + (p.shares || 0)), 0) };

  if (loading) return <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Social Media</h1><p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Manage posts across LinkedIn, Twitter, Facebook & Instagram</p></div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Posts</CardTitle><Share2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">LinkedIn</CardTitle><Linkedin className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.linkedin}</div><p className="text-xs text-blue-600 dark:text-blue-400">Primary platform</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Scheduled</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.scheduled}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Published</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.published}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Engagement</CardTitle><Heart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalEngagement}</div><p className="text-xs text-muted-foreground">Total interactions</p></CardContent></Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" /><Input placeholder="Search posts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Platforms</SelectItem><SelectItem value="linkedin">LinkedIn</SelectItem><SelectItem value="twitter">Twitter</SelectItem><SelectItem value="facebook">Facebook</SelectItem><SelectItem value="instagram">Instagram</SelectItem></SelectContent>
        </Select>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Post</Button></DialogTrigger><DialogContent className="max-w-2xl"><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>Create Social Post</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label>Platform *</Label><Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="linkedin">LinkedIn (Primary)</SelectItem><SelectItem value="twitter">Twitter</SelectItem><SelectItem value="facebook">Facebook</SelectItem><SelectItem value="instagram">Instagram</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Content *</Label><Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows={6} placeholder="What's on your mind?" /></div><div className="space-y-2"><Label>Hashtags</Label><Input value={formData.hashtags} onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })} placeholder="#VirtualAssistant #Remote #Belize" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Status *</Label><Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="published">Publish Now</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Schedule For</Label><Input type="datetime-local" value={formData.scheduled_for} onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })} /></div></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit">Create Post</Button></DialogFooter></form></DialogContent></Dialog>
      </div>

      <Table><TableHeader><TableRow><TableHead>Platform</TableHead><TableHead>Content</TableHead><TableHead>Status</TableHead><TableHead>Scheduled</TableHead><TableHead>Engagement</TableHead></TableRow></TableHeader><TableBody>{posts.filter(p => p.content.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8"><div className="flex flex-col items-center gap-2"><Linkedin className="w-12 h-12 text-muted-foreground" /><p className="text-muted-foreground">No posts yet. Start scheduling content!</p></div></TableCell></TableRow> : posts.filter(p => p.content.toLowerCase().includes(searchTerm.toLowerCase())).map(post => { const Icon = platformIcons[post.platform as keyof typeof platformIcons]; return <TableRow key={post.id}><TableCell><div className="flex items-center gap-2">{Icon && <Icon className="w-4 h-4" />}<span className="capitalize">{post.platform}</span></div></TableCell><TableCell><div className="max-w-md"><p className="line-clamp-2">{post.content}</p>{post.hashtags?.length > 0 && <p className="text-xs text-blue-600 mt-1">{post.hashtags.join(' ')}</p>}</div></TableCell><TableCell><Badge className={statusColors[post.status as keyof typeof statusColors]}>{post.status}</Badge></TableCell><TableCell>{post.scheduled_for ? format(new Date(post.scheduled_for), 'MMM d, h:mm a') : '—'}</TableCell><TableCell><div className="flex gap-3 text-sm"><span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes || 0}</span><span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments || 0}</span><span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{post.shares || 0}</span></div></TableCell></TableRow>})}</TableBody></Table>
    </div>
  );
}
