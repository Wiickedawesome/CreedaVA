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
import { Plus, Search, Route, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

type CustomerJourney = any;
const stageColors = { awareness: 'bg-blue-500', consideration: 'bg-purple-500', decision: 'bg-green-500', retention: 'bg-emerald-500', advocacy: 'bg-pink-500' };
const stages = ['awareness', 'consideration', 'decision', 'retention', 'advocacy'];

export function CustomerJourney() {
  const { user } = useAuth();
  const [journeys, setJourneys] = useState<CustomerJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJourney, setEditingJourney] = useState<CustomerJourney | null>(null);
  const [formData, setFormData] = useState({ lead_id: '', contact_id: '', stage: 'awareness', touchpoints: '', utm_source: '', utm_medium: '', utm_campaign: '', conversion_value: '' });

  useEffect(() => { fetchJourneys(); }, []);

  const fetchJourneys = async () => {
    try {
      const { data, error } = await supabase.from('customer_journeys').select('*, leads(company_name), contacts(first_name, last_name)').order('created_at', { ascending: false });
      if (error) throw error;
      setJourneys(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData, created_by: user?.id, touchpoints: formData.touchpoints ? parseInt(formData.touchpoints) : null, conversion_value: formData.conversion_value ? parseFloat(formData.conversion_value) : null };
      if (editingJourney) {
        const { error } = await supabase.from('customer_journeys').update(dataToSubmit).eq('id', editingJourney.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customer_journeys').insert([dataToSubmit]);
        if (error) throw error;
      }
      setIsDialogOpen(false);
      setEditingJourney(null);
      setFormData({ lead_id: '', contact_id: '', stage: 'awareness', touchpoints: '', utm_source: '', utm_medium: '', utm_campaign: '', conversion_value: '' });
      fetchJourneys();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const stats = { total: journeys.length, awareness: journeys.filter(j => j.stage === 'awareness').length, decision: journeys.filter(j => j.stage === 'decision').length, converted: journeys.filter(j => j.converted_at).length };

  if (loading) return <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-white">Customer Journey</h1>
        <p className="text-gray-300 mt-2 font-medium">Track customer lifecycle stages</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-600 p-4 rounded-lg border border-blue-500">
          <p className="text-sm font-medium text-blue-100">Total Journeys</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-purple-600 p-4 rounded-lg border border-purple-500">
          <p className="text-sm font-medium text-purple-100">Awareness</p>
          <p className="text-3xl font-bold text-white">{stats.awareness}</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg border border-green-500">
          <p className="text-sm font-medium text-green-100">Decision Stage</p>
          <p className="text-3xl font-bold text-white">{stats.decision}</p>
        </div>
        <div className="bg-amber-600 p-4 rounded-lg border border-amber-500">
          <p className="text-sm font-medium text-amber-100">Converted</p>
          <p className="text-3xl font-bold text-white">{stats.converted}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search journeys..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500" 
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button onClick={() => { setEditingJourney(null); setFormData({ lead_id: '', contact_id: '', stage: 'awareness', touchpoints: '', utm_source: '', utm_medium: '', utm_campaign: '', conversion_value: '' }); }}><Plus className="w-4 h-4 mr-2" />New Journey</Button></DialogTrigger><DialogContent><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>{editingJourney ? 'Edit' : 'Create'} Customer Journey</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Lead ID</Label><Input value={formData.lead_id} onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })} placeholder="UUID" /></div><div className="space-y-2"><Label>Contact ID</Label><Input value={formData.contact_id} onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })} placeholder="UUID" /></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Stage *</Label><Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Touchpoints</Label><Input type="number" value={formData.touchpoints} onChange={(e) => setFormData({ ...formData, touchpoints: e.target.value })} /></div></div><div className="space-y-2"><Label>UTM Source</Label><Input value={formData.utm_source} onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })} placeholder="google, linkedin, email" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>UTM Medium</Label><Input value={formData.utm_medium} onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })} placeholder="cpc, organic, social" /></div><div className="space-y-2"><Label>UTM Campaign</Label><Input value={formData.utm_campaign} onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })} /></div></div><div className="space-y-2"><Label>Conversion Value</Label><Input type="number" step="0.01" value={formData.conversion_value} onChange={(e) => setFormData({ ...formData, conversion_value: e.target.value })} placeholder="0.00" /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit">{editingJourney ? 'Update' : 'Create'}</Button></DialogFooter></form></DialogContent></Dialog>
      </div>

      <Table><TableHeader><TableRow><TableHead>Lead/Contact</TableHead><TableHead>Stage</TableHead><TableHead>Touchpoints</TableHead><TableHead>UTM Source</TableHead><TableHead>Value</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{journeys.filter(j => (j.leads?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8"><div className="flex flex-col items-center gap-2"><Route className="w-12 h-12 text-muted-foreground" /><p className="text-muted-foreground">No journeys tracked yet. Start mapping!</p></div></TableCell></TableRow> : journeys.filter(j => (j.leads?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(journey => <TableRow key={journey.id}><TableCell className="font-medium">{journey.leads?.company_name || (journey.contacts ? `${journey.contacts.first_name} ${journey.contacts.last_name}` : 'Unknown')}</TableCell><TableCell><Badge className={stageColors[journey.stage as keyof typeof stageColors]}>{journey.stage}</Badge></TableCell><TableCell>{journey.touchpoints || 0}</TableCell><TableCell>{journey.utm_source || '—'}</TableCell><TableCell>{journey.conversion_value ? `$${journey.conversion_value.toFixed(2)}` : '—'}</TableCell><TableCell>{format(new Date(journey.created_at), 'MMM d, yyyy')}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => { setEditingJourney(journey); setFormData({ lead_id: journey.lead_id || '', contact_id: journey.contact_id || '', stage: journey.stage, touchpoints: journey.touchpoints?.toString() || '', utm_source: journey.utm_source || '', utm_medium: journey.utm_medium || '', utm_campaign: journey.utm_campaign || '', conversion_value: journey.conversion_value?.toString() || '' }); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="sm" onClick={async () => { if (confirm('Delete this journey?')) { await supabase.from('customer_journeys').delete().eq('id', journey.id); fetchJourneys(); } }}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></TableCell></TableRow>)}</TableBody></Table>
    </div>
  );
}
