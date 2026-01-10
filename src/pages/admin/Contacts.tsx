import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/admin/PageLayout';
import { ContactDialog, Contact } from '@/components/admin/ContactDialog';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Mail, 
  Calendar, 
  RefreshCw, 
  Plus, 
  Eye, 
  Edit, 
  Trash2 
} from 'lucide-react';

interface Contact {
  id: string;
  type: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  timestamp: string;
  service?: string;
}

type ContactFormData = {
  name: string;
  email: string;
  service?: string;
  message: string;
};

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authorizedFetch(`${API_BASE}/getContacts`);
      
      if (response.ok) {
        const result = await response.json();
        setContacts(result.data || []);
      } else {
        throw new Error('Failed to fetch contacts');
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async (contactData: ContactFormData) => {
    try {
      if (dialogMode === 'create') {
        const response = await authorizedFetch(`${API_BASE}/createContacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contactData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create contact');
        }
      } else if (dialogMode === 'edit' && selectedContact) {
        const response = await authorizedFetch(`${API_BASE}/updateContacts/${selectedContact.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contactData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update contact');
        }
      }
      
      // Refresh the contacts list
      await fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      throw error;
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    
    try {
      const response = await authorizedFetch(`${API_BASE}/deleteContacts/${contactToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }
      
      // Refresh the contacts list
      await fetchContacts();
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
      // You might want to show a toast notification here
    }
  };

  const openCreateDialog = () => {
    setSelectedContact(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const openEditDialog = (contact: Contact) => {
    setSelectedContact(contact);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const openViewDialog = (contact: Contact) => {
    setSelectedContact(contact);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const openDeleteDialog = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout
      title="Contacts"
      description="Manage contact form submissions"
      searchPlaceholder="Search contacts..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      stats={[
        { label: 'total contacts', value: contacts.length }
      ]}
      secondaryActions={[
        {
          label: 'Refresh',
          onClick: fetchContacts,
          variant: 'outline',
          icon: <RefreshCw className="h-4 w-4" />
        }
      ]}
      primaryAction={{
        label: 'Add Contact',
        onClick: openCreateDialog,
        icon: <Plus className="h-4 w-4" />
      }}
    >
      {loading ? (
        <div className="text-center py-8">Loading contacts...</div>
      ) : error ? (
        <ErrorPanel message={error} onRetry={fetchContacts} />
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">Email</TableHead>
                <TableHead className="text-gray-300">Phone</TableHead>
                <TableHead className="text-gray-300">Service</TableHead>
                <TableHead className="text-gray-300">Message</TableHead>
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow className="border-gray-700">
                  <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                    {searchTerm ? 'No contacts found matching your search' : 'No contacts found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="border-gray-700 hover:bg-gray-800">
                    <TableCell className="font-medium text-gray-200">{contact.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">{contact.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300">
                        {contact.phone || <span className="text-gray-500">—</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      {contact.service && (
                        <Badge variant="secondary">{contact.service}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-gray-300" title={contact.message}>
                        {contact.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {new Date(contact.timestamp).toLocaleDateString()} {' '}
                          {new Date(contact.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(contact)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(contact)}
                          title="Edit contact"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(contact)}
                          title="Delete contact"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Contact Dialog */}
      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={selectedContact}
        onSave={handleSaveContact}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the contact for{' '}
              <strong>{contactToDelete?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteContact}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}