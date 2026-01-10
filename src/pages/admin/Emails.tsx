import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/admin/PageLayout';
import { EmailDialog, EmailCampaign } from '@/components/admin/EmailDialog';
import { authorizedFetch } from '@/lib/api-client';
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
import { 
  Mail, 
  Plus, 
  RefreshCw, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Send, 
  Users, 
  Calendar,
  Target,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type EmailFormData = {
  name: string;
  subject: string;
  content: string;
  status: string;
  template: string;
  audience: string;
  recipientCount: number;
  scheduledDate?: Date;
  tags?: string;
  previewText?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
};

const emailStatuses = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500', textColor: 'text-gray-400' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { value: 'sending', label: 'Sending', color: 'bg-orange-500', textColor: 'text-orange-400' },
  { value: 'sent', label: 'Sent', color: 'bg-green-500', textColor: 'text-green-400' },
  { value: 'paused', label: 'Paused', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500', textColor: 'text-red-400' },
];

export function Emails() {
  const [emails, setEmails] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedEmail, setSelectedEmail] = useState<EmailCampaign | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<EmailCampaign | null>(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071/api';
      const response = await authorizedFetch(`${API_BASE}/getEmails`);
      
      if (response.ok) {
        const result = await response.json();
        setEmails(result.data || []);
      } else {
        throw new Error('Failed to fetch emails');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Failed to load email campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmail = () => {
    setSelectedEmail(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditEmail = (email: EmailCampaign) => {
    setSelectedEmail(email);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleViewEmail = (email: EmailCampaign) => {
    setSelectedEmail(email);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleSaveEmail = async (emailData: Omit<EmailCampaign, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071/api';
      
      if (dialogMode === 'create') {
        const response = await authorizedFetch(`${API_BASE}/createEmail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData)
        });
        
        if (response.ok) {
          await fetchEmails();
        } else {
          throw new Error('Failed to create email campaign');
        }
      } else if (dialogMode === 'edit' && selectedEmail) {
        const response = await authorizedFetch(`${API_BASE}/updateEmail/${selectedEmail.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData)
        });
        
        if (response.ok) {
          await fetchEmails();
        } else {
          throw new Error('Failed to update email campaign');
        }
      }
    } catch (error) {
      console.error('Error saving email:', error);
      setError('Failed to save email campaign. Please try again.');
    }
  };

  const handleDeleteEmail = async () => {
    if (!emailToDelete) return;
    
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071/api';
      const response = await authorizedFetch(`${API_BASE}/deleteEmail/${emailToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchEmails();
        setDeleteDialogOpen(false);
        setEmailToDelete(null);
      } else {
        throw new Error('Failed to delete email campaign');
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      setError('Failed to delete email campaign. Please try again.');
    }
  };

  const filteredEmails = emails.filter(email =>
    email.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.audience.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = emailStatuses.find(s => s.value === status);
    if (!statusConfig) return null;
    
    return (
      <Badge className={cn("px-2 py-1 text-xs font-medium rounded-full", statusConfig.color)}>
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <>
      <PageLayout
        title="Email Campaigns"
        description="Create and manage email marketing campaigns"
        searchPlaceholder="Search campaigns..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        primaryAction={{
          label: 'Create Campaign',
          onClick: handleCreateEmail,
          icon: <Plus className="h-4 w-4" />
        }}
        secondaryActions={[
          {
            label: 'Refresh',
            onClick: fetchEmails,
            icon: <RefreshCw className="h-4 w-4" />
          }
        ]}
      >
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading email campaigns...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Mail className="h-8 w-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={fetchEmails} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Campaign</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Audience</TableHead>
                  <TableHead className="text-gray-300">Recipients</TableHead>
                  <TableHead className="text-gray-300">Performance</TableHead>
                  <TableHead className="text-gray-300">Scheduled</TableHead>
                  <TableHead className="text-gray-300 w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg mb-2">No email campaigns found</p>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first email campaign'}
                      </p>
                      {!searchTerm && (
                        <Button onClick={handleCreateEmail} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Campaign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmails.map((email) => {
                    return (
                      <TableRow key={email.id} className="border-gray-700 hover:bg-gray-750">
                        <TableCell>
                          <div>
                            <div className="font-medium text-white">{email.name}</div>
                            <div className="text-sm text-gray-400 truncate max-w-xs">
                              {email.subject}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(email.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-300">
                            {email.audience.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-white">
                            {email.recipientCount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {email.openRate !== undefined ? (
                              <div className="space-y-1">
                                <div className="text-green-400">Open: {email.openRate}%</div>
                                <div className="text-blue-400">Click: {email.clickRate || 0}%</div>
                              </div>
                            ) : (
                              <div className="text-gray-500">No data</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-300 text-sm">
                            {email.scheduledDate ? (
                              format(new Date(email.scheduledDate), 'MMM dd, HH:mm')
                            ) : email.sentDate ? (
                              `Sent ${format(new Date(email.sentDate), 'MMM dd')}`
                            ) : (
                              'Not scheduled'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                              <DropdownMenuItem onClick={() => handleViewEmail(email)} className="text-gray-300 hover:bg-gray-700">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditEmail(email)} className="text-gray-300 hover:bg-gray-700">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Campaign
                              </DropdownMenuItem>
                              {email.status === 'draft' && (
                                <DropdownMenuItem onClick={() => handleEditEmail(email)} className="text-blue-400 hover:bg-blue-900/20">
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Now
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => {
                                  setEmailToDelete(email);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-400 hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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

      {/* Email Dialog */}
      <EmailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        email={selectedEmail}
        onSave={handleSaveEmail}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Email Campaign</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{emailToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEmail}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}