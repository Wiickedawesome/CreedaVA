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
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, TrendingUp, DollarSign, BarChart3, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

type AdCampaign = any;
const statusColors = { draft: 'secondary', active: 'default', paused: 'secondary', completed: 'secondary' };
const platforms = ['google_ads', 'facebook', 'linkedin', 'instagram', 'twitter'];

export function AdCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [formData, setFormData] = useState({ name: '', platform: 'google_ads', budget: '', spend: '', status: 'draft', start_date: '', end_date: '', impressions: 0, clicks: 0, conversions: 0 });

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      // Failed to fetch campaigns
    } finally {
      setLoading(false);
    }
  };

  const calculateROI = (campaign: AdCampaign) => {
    const revenue = (campaign.conversions || 0) * (campaign.conversion_value || 0);
    const spend = parseFloat(campaign.spend) || 0;
    return spend > 0 ? ((revenue - spend) / spend * 100).toFixed(1) : '0.0';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData, created_by: user?.id, budget: parseFloat(formData.budget), spend: parseFloat(formData.spend) };
      if (editingCampaign) {
        const { error } = await supabase.from('ad_campaigns').update(dataToSubmit as any).eq('id', editingCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ad_campaigns').insert([dataToSubmit as any]);
        if (error) throw error;
      }
      setIsDialogOpen(false);
      setEditingCampaign(null);
      setFormData({ name: '', platform: 'google_ads', budget: '', spend: '', status: 'draft', start_date: '', end_date: '', impressions: 0, clicks: 0, conversions: 0 });
      fetchCampaigns();
    } catch (error) {
      alert('Failed to save campaign');
    }
  };

  const stats = { total: campaigns.length, active: campaigns.filter(c => c.status === 'active').length, totalSpend: campaigns.reduce((sum, c) => sum + (parseFloat(c.spend) || 0), 0), totalConversions: campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0) };

  if (loading) return <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-white">Ad Campaigns</h1>
        <p className="text-gray-300 mt-2 font-medium">Track advertising performance and ROI</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
          <p className="text-sm font-medium text-gray-300">Total Campaigns</p>
          <p className="text-2xl font-bold text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg border border-green-500">
          <p className="text-sm font-medium text-green-100">Active</p>
          <p className="text-2xl font-bold text-white mt-2">{stats.active}</p>
        </div>
        <div className="bg-red-600 p-4 rounded-lg border border-red-500">
          <p className="text-sm font-medium text-red-100">Total Spend</p>
          <p className="text-2xl font-bold text-white mt-2">${stats.totalSpend.toFixed(2)}</p>
        </div>
        <div className="bg-blue-600 p-4 rounded-lg border border-blue-500">
          <p className="text-sm font-medium text-blue-100">Conversions</p>
          <p className="text-2xl font-bold text-white mt-2">{stats.totalConversions}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search campaigns..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500" 
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button onClick={() => { setEditingCampaign(null); setFormData({ name: '', platform: 'google_ads', budget: '', spend: '', status: 'draft', start_date: '', end_date: '', impressions: 0, clicks: 0, conversions: 0 }); }}><Plus className="w-4 h-4 mr-2" />New Campaign</Button></DialogTrigger><DialogContent className="max-w-2xl"><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>{editingCampaign ? 'Edit' : 'Create'} Campaign</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Platform *</Label><Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{platforms.map(p => <SelectItem key={p} value={p}>{p.replace('_', ' ').toUpperCase()}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Status *</Label><Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Budget *</Label><Input type="number" step="0.01" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} required /></div><div className="space-y-2"><Label>Spend</Label><Input type="number" step="0.01" value={formData.spend} onChange={(e) => setFormData({ ...formData, spend: e.target.value })} /></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Start Date</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} /></div><div className="space-y-2"><Label>End Date</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} /></div></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit">{editingCampaign ? 'Update' : 'Create'}</Button></DialogFooter></form></DialogContent></Dialog>
      </div>

      <div className="bg-gray-700 rounded-lg border border-gray-600">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800 border-gray-600">
              <TableHead className="text-gray-200 font-medium">Name</TableHead>
              <TableHead className="text-gray-200 font-medium">Platform</TableHead>
              <TableHead className="text-gray-200 font-medium">Status</TableHead>
              <TableHead className="text-gray-200 font-medium">Budget</TableHead>
              <TableHead className="text-gray-200 font-medium">Spend</TableHead>
              <TableHead className="text-gray-200 font-medium">ROI</TableHead>
              <TableHead className="text-right text-gray-200 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <TrendingUp className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No campaigns yet. Launch your first ad!</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(campaign => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.platform.replace('_', ' ').toUpperCase()}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${parseFloat(campaign.budget || 0).toFixed(2)}</TableCell>
                  <TableCell>${parseFloat(campaign.spend || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={parseFloat(calculateROI(campaign)) > 0 ? 'text-green-600' : 'text-red-600'}>
                      {calculateROI(campaign)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingCampaign(campaign);
                          setFormData({
                            name: campaign.name,
                            platform: campaign.platform,
                            budget: campaign.budget,
                            spend: campaign.spend,
                            status: campaign.status,
                            start_date: campaign.start_date || '',
                            end_date: campaign.end_date || '',
                            impressions: campaign.impressions || 0,
                            clicks: campaign.clicks || 0,
                            conversions: campaign.conversions || 0
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={async () => {
                          if (confirm('Delete this campaign?')) {
                            await supabase.from('ad_campaigns').delete().eq('id', campaign.id);
                            fetchCampaigns();
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
