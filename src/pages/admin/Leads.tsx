import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/admin/PageLayout';
import { LeadDialog, Lead } from '@/components/admin/LeadDialog';
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
import { Mail, Phone, Calendar, RefreshCw, Plus, MoreHorizontal, Eye, Edit, Trash2, Star, Building2, DollarSign } from 'lucide-react';

type LeadFormData = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source: string;
  stage: string;
  score: number;
  estimatedValue?: number;
  notes?: string;
};

const leadStages = [
  { value: 'new', label: 'New Lead', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
  { value: 'proposal', label: 'Proposal Sent', color: 'bg-orange-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-pink-500' },
  { value: 'closed-won', label: 'Closed Won', color: 'bg-green-500' },
  { value: 'closed-lost', label: 'Closed Lost', color: 'bg-red-500' },
];

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const { signIn } = useAuth()
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authorizedFetch(`${API_BASE}/getLeads`);
      
      if (response.ok) {
        const result = await response.json();
        setLeads(result.data || []);
      } else {
        throw new Error('Failed to fetch leads');
      }
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads');
      setErrorStatus(err?.status || null)
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLead = async (leadData: LeadFormData) => {
    try {
      if (dialogMode === 'create') {
        const response = await authorizedFetch(`${API_BASE}/createLeads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(leadData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create lead');
        }
      } else if (dialogMode === 'edit' && selectedLead) {
        const response = await authorizedFetch(`${API_BASE}/updateLeads/${selectedLead.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(leadData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update lead');
        }
      }
      
      // Refresh leads after save
      await fetchLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      throw error;
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    
    try {
      const response = await authorizedFetch(`${API_BASE}/deleteLeads/${leadToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete lead');
      }
      
      // Refresh leads after delete
      await fetchLeads();
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleCreateLead = () => {
    setSelectedLead(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const confirmDeleteLead = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const getStageInfo = (stage: string) => {
    return leadStages.find(s => s.value === stage) || { label: stage, color: 'bg-gray-500' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  // Calculate stats
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(lead => ['qualified', 'proposal', 'negotiation'].includes(lead.stage)).length;
  const closedWonLeads = leads.filter(lead => lead.stage === 'closed-won').length;
  const totalValue = leads
    .filter(lead => lead.stage === 'closed-won')
    .reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);

  return (
    <>
      <PageLayout
        title="Leads"
        description="Lead pipeline and management"
        searchPlaceholder="Search leads..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        stats={[
          { label: 'total leads', value: totalLeads },
          { label: 'qualified leads', value: qualifiedLeads },
          { label: 'closed won', value: closedWonLeads },
          { label: 'total value', value: `$${totalValue.toLocaleString()}` }
        ]}
        secondaryActions={[
          {
            label: 'Refresh',
            onClick: fetchLeads,
            variant: 'outline',
            icon: <RefreshCw className="h-4 w-4" />
          }
        ]}
        primaryAction={{
          label: 'Add Lead',
          onClick: handleCreateLead,
          icon: <Plus className="h-4 w-4" />
        }}
      >
        {loading ? (
          <div className="text-center py-8 text-gray-300">Loading leads...</div>
        ) : error ? (
          <div className="text-center py-8">
            <ErrorPanel
              message={error}
              onRetry={fetchLeads}
              onSignIn={errorStatus === 401 ? async () => { await signIn(); fetchLeads() } : undefined}
            />
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg border border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Lead</TableHead>
                  <TableHead className="text-gray-300">Contact</TableHead>
                  <TableHead className="text-gray-300">Company</TableHead>
                  <TableHead className="text-gray-300">Source</TableHead>
                  <TableHead className="text-gray-300">Stage</TableHead>
                  <TableHead className="text-gray-300">Score</TableHead>
                  <TableHead className="text-gray-300">Value</TableHead>
                  <TableHead className="text-gray-300">Date</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow className="border-gray-700">
                    <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                      {searchTerm ? 'No leads found matching your search' : 'No leads found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => {
                    const stageInfo = getStageInfo(lead.stage);
                    return (
                      <TableRow key={lead.id} className="border-gray-700 hover:bg-gray-800">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-200">{lead.name}</p>
                            {lead.position && (
                              <p className="text-sm text-gray-400">{lead.position}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-300">{lead.email}</span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span className="text-sm text-gray-300">{lead.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">{lead.company || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{lead.source}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${stageInfo.color} text-white`}>
                            {stageInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Star className={`h-4 w-4 ${getScoreColor(lead.score)}`} />
                            <span className={`font-medium ${getScoreColor(lead.score)}`}>
                              {lead.score}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 font-medium">
                              {lead.estimatedValue?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                              <DropdownMenuItem 
                                onClick={() => handleViewLead(lead)}
                                className="text-gray-300 hover:bg-gray-700"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEditLead(lead)}
                                className="text-gray-300 hover:bg-gray-700"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Lead
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => confirmDeleteLead(lead)}
                                className="text-red-400 hover:bg-gray-700"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Lead
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

      {/* Lead Dialog */}
      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={selectedLead}
        onSave={handleSaveLead}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Lead</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{leadToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteLead}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
