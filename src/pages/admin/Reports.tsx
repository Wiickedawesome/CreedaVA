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
import { Plus, Search, FileText, Download, Edit, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

type MarketingReport = any;
const reportTypes = ['campaign', 'attribution', 'content', 'social', 'custom'];
const statusColors = { scheduled: 'bg-blue-500', completed: 'bg-green-500', failed: 'bg-red-500' };

export function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<MarketingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<MarketingReport | null>(null);
  const [formData, setFormData] = useState({ name: '', report_type: 'campaign', date_range_start: '', date_range_end: '', schedule_frequency: '', status: 'completed' });

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase.from('marketing_reports').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData, created_by: user?.id, report_data: {} };
      if (editingReport) {
        const { error } = await supabase.from('marketing_reports').update(dataToSubmit).eq('id', editingReport.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('marketing_reports').insert([dataToSubmit]);
        if (error) throw error;
      }
      setIsDialogOpen(false);
      setEditingReport(null);
      setFormData({ name: '', report_type: 'campaign', date_range_start: '', date_range_end: '', schedule_frequency: '', status: 'completed' });
      fetchReports();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const stats = { total: reports.length, scheduled: reports.filter(r => r.status === 'scheduled').length, completed: reports.filter(r => r.status === 'completed').length, lastGenerated: reports.length > 0 ? reports[0].created_at : null };

  if (loading) return <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-white">Marketing Reports</h1>
        <p className="text-gray-300 mt-2 font-medium">Generate and schedule custom reports</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
          <p className="text-sm font-medium text-gray-300">Total Reports</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-blue-600 p-4 rounded-lg border border-blue-500">
          <p className="text-sm font-medium text-blue-100">Scheduled</p>
          <p className="text-3xl font-bold text-white">{stats.scheduled}</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg border border-green-500">
          <p className="text-sm font-medium text-green-100">Completed</p>
          <p className="text-3xl font-bold text-white">{stats.completed}</p>
        </div>
        <div className="bg-purple-600 p-4 rounded-lg border border-purple-500">
          <p className="text-sm font-medium text-purple-100">Last Generated</p>
          <p className="text-xl font-bold text-white">{stats.lastGenerated ? format(new Date(stats.lastGenerated), 'MMM d') : 'Never'}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" /><Input placeholder="Search reports..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button onClick={() => { setEditingReport(null); setFormData({ name: '', report_type: 'campaign', date_range_start: '', date_range_end: '', schedule_frequency: '', status: 'completed' }); }}><Plus className="w-4 h-4 mr-2" />New Report</Button></DialogTrigger><DialogContent><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>{editingReport ? 'Edit' : 'Create'} Report</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Type *</Label><Select value={formData.report_type} onValueChange={(value) => setFormData({ ...formData, report_type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{reportTypes.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Start Date</Label><Input type="date" value={formData.date_range_start} onChange={(e) => setFormData({ ...formData, date_range_start: e.target.value })} /></div><div className="space-y-2"><Label>End Date</Label><Input type="date" value={formData.date_range_end} onChange={(e) => setFormData({ ...formData, date_range_end: e.target.value })} /></div></div><div className="space-y-2"><Label>Schedule Frequency</Label><Select value={formData.schedule_frequency} onValueChange={(value) => setFormData({ ...formData, schedule_frequency: value })}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit">{editingReport ? 'Update' : 'Create'}</Button></DialogFooter></form></DialogContent></Dialog>
      </div>

      <div className="bg-gray-700 rounded-lg border border-gray-600">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800 border-gray-600">
              <TableHead className="text-gray-200 font-medium">Name</TableHead>
              <TableHead className="text-gray-200 font-medium">Type</TableHead>
              <TableHead className="text-gray-200 font-medium">Date Range</TableHead>
              <TableHead className="text-gray-200 font-medium">Frequency</TableHead>
              <TableHead className="text-gray-200 font-medium">Status</TableHead>
              <TableHead className="text-gray-200 font-medium">Created</TableHead>
              <TableHead className="text-right text-gray-200 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No reports yet. Create your first!</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(report => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}</TableCell>
                  <TableCell className="text-sm">
                    {report.date_range_start && report.date_range_end 
                      ? `${format(new Date(report.date_range_start), 'MMM d')} - ${format(new Date(report.date_range_end), 'MMM d')}`
                      : '—'
                    }
                  </TableCell>
                  <TableCell>
                    {report.schedule_frequency ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.schedule_frequency}
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[report.status as keyof typeof statusColors]}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(report.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => alert('Download functionality coming soon!')}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingReport(report);
                          setFormData({
                            name: report.name,
                            report_type: report.report_type,
                            date_range_start: report.date_range_start || '',
                            date_range_end: report.date_range_end || '',
                            schedule_frequency: report.schedule_frequency || '',
                            status: report.status
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
                          if (confirm('Delete this report?')) {
                            await supabase.from('marketing_reports').delete().eq('id', report.id);
                            fetchReports();
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
