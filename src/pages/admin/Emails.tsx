import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Mail, Eye } from 'lucide-react';
import { format } from 'date-fns';

type Email = Database['public']['Tables']['emails']['Row'];
type EmailInsert = Database['public']['Tables']['emails']['Insert'];

const statusColors = { draft: 'bg-gray-500', scheduled: 'bg-blue-500', sent: 'bg-green-500', delivered: 'bg-purple-500', opened: 'bg-yellow-500', clicked: 'bg-emerald-500', replied: 'bg-teal-500', bounced: 'bg-red-500', failed: 'bg-red-700' };

export function Emails() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<EmailInsert>>({ subject: '', body: '', from_email: '', to_email: '', status: 'draft' });

  useEffect(() => { fetchEmails(); }, []);

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase.from('emails').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData, user_id: user?.id };
      const { error } = await supabase.from('emails').insert([dataToSubmit as EmailInsert]);
      if (error) throw error;
      setIsDialogOpen(false);
      setFormData({ subject: '', body: '', from_email: '', to_email: '', status: 'draft' });
      fetchEmails();
    } catch (error) {
      console.error('Error saving email:', error);
    }
  };

  const filteredEmails = emails.filter(e => e.subject.toLowerCase().includes(searchTerm.toLowerCase()) || e.to_email.toLowerCase().includes(searchTerm.toLowerCase()));
  const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent' || e.status === 'delivered').length, opened: emails.filter(e => e.status === 'opened' || e.status === 'clicked').length };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;

  return (
    <div className="p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-semibold text-white">Email Campaigns</h1>
        <p className="text-gray-300 mt-1">Manage email outreach</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-600 p-4 rounded-lg border border-blue-500">
          <p className="text-sm font-medium text-blue-100">Total Emails</p>
          <p className="text-2xl font-bold text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg border border-green-500">
          <p className="text-sm font-medium text-green-100">Sent</p>
          <p className="text-2xl font-bold text-white mt-2">{stats.sent}</p>
        </div>
        <div className="bg-yellow-600 p-4 rounded-lg border border-yellow-500">
          <p className="text-sm font-medium text-yellow-100">Opened</p>
          <p className="text-2xl font-bold text-white mt-2">{stats.opened}</p>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white w-4 h-4" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-white" /></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Email</Button></DialogTrigger><DialogContent><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>Draft Email</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label>From *</Label><Input value={formData.from_email} onChange={(e) => setFormData({ ...formData, from_email: e.target.value })} required type="email" /></div><div className="space-y-2"><Label>To *</Label><Input value={formData.to_email} onChange={(e) => setFormData({ ...formData, to_email: e.target.value })} required type="email" /></div><div className="space-y-2"><Label>Subject *</Label><Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required /></div><div className="space-y-2"><Label>Body *</Label><Textarea value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} required rows={6} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit">Save Draft</Button></DialogFooter></form></DialogContent></Dialog>
      </div>
      <div className="bg-gray-700 rounded-lg border border-gray-600">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800 border-gray-600">
              <TableHead className="text-gray-200 font-medium">Subject</TableHead>
              <TableHead className="text-gray-200 font-medium">To</TableHead>
              <TableHead className="text-gray-200 font-medium">Status</TableHead>
              <TableHead className="text-gray-200 font-medium">Sent</TableHead>
              <TableHead className="text-gray-200 font-medium">Opens</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmails.length === 0 ? (
              <TableRow className="border-gray-600">
                <TableCell colSpan={5} className="text-center text-gray-300 py-8">No emails yet</TableCell>
              </TableRow>
            ) : (
              filteredEmails.map(e => (
                <TableRow key={e.id} className="border-gray-600 hover:bg-gray-650">
                  <TableCell>
                    <div className="font-medium text-white">{e.subject}</div>
                  </TableCell>
                  <TableCell className="text-gray-300">{e.to_email}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[e.status as keyof typeof statusColors]}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{e.sent_at ? format(new Date(e.sent_at), 'MMM d, yyyy') : '—'}</TableCell>
                  <TableCell className="text-gray-300">{e.opens_count || 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
