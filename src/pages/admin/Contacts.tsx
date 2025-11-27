import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Mail, Phone, Linkedin, Heart } from 'lucide-react';
import { format } from 'date-fns';

type Contact = Database['public']['Tables']['contacts']['Row'];
type ContactInsert = Database['public']['Tables']['contacts']['Insert'];

const relationshipColors = {
  weak: 'bg-gray-500',
  moderate: 'bg-yellow-500',
  strong: 'bg-blue-500',
  champion: 'bg-purple-500'
};

const relationshipIcons = {
  weak: 1,
  moderate: 2,
  strong: 3,
  champion: 4
};

const seniorityLevels = {
  c_level: 'C-Level',
  vp: 'VP',
  director: 'Director',
  manager: 'Manager',
  individual_contributor: 'Individual Contributor',
  other: 'Other'
};

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<Partial<ContactInsert>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    company: '',
    position: '',
    department: '',
    seniority: null,
    linkedin_url: '',
    preferred_contact_method: null,
    notes: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }
      setContacts(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contacts';
      console.error('Error fetching contacts:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update(formData)
          .eq('id', editingContact.id);

        if (error) {
          console.error('Update error:', error);
          throw new Error(error.message);
        }
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert([formData as ContactInsert]);

        if (error) {
          console.error('Insert error:', error);
          throw new Error(error.message);
        }
      }

      setIsDialogOpen(false);
      setEditingContact(null);
      resetForm();
      fetchContacts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save contact';
      alert(`Error: ${errorMessage}`);
      console.error('Error saving contact:', error);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      mobile: contact.mobile,
      company: contact.company,
      position: contact.position,
      department: contact.department,
      seniority: contact.seniority,
      linkedin_url: contact.linkedin_url,
      preferred_contact_method: contact.preferred_contact_method,
      notes: contact.notes
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(error.message);
      }
      fetchContacts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete contact';
      alert(`Error: ${errorMessage}`);
      console.error('Error deleting contact:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      mobile: '',
      company: '',
      position: '',
      department: '',
      seniority: null,
      linkedin_url: '',
      preferred_contact_method: null,
      notes: ''
    });
  };

  const filteredContacts = contacts.filter(contact =>
    contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center max-w-md p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Failed to Load Contacts</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={fetchContacts} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Contacts Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Manage your professional network and relationships</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" onClick={() => {
              setEditingContact(null);
              resetForm();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Edit Contact' : 'Create New Contact'}</DialogTitle>
              <DialogDescription>
                {editingContact ? 'Update contact information' : 'Add a new contact to your network'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="seniority">Seniority Level</Label>
                  <Select
                    value={formData.seniority || ''}
                    onValueChange={(value) => setFormData({ ...formData, seniority: value as Contact['seniority'] })}
                  >
                    <SelectTrigger id="seniority">
                      <SelectValue placeholder="Select seniority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="c_level">C-Level</SelectItem>
                      <SelectItem value="vp">VP</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="individual_contributor">Individual Contributor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
                  <Select
                    value={formData.preferred_contact_method || ''}
                    onValueChange={(value) => setFormData({ ...formData, preferred_contact_method: value as Contact['preferred_contact_method'] })}
                  >
                    <SelectTrigger id="preferred_contact_method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={formData.linkedin_url || ''}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {editingContact ? 'Update Contact' : 'Create Contact'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100 dark:bg-slate-700/50 border-b border-slate-300 dark:border-slate-600">
              <TableHead className="text-slate-900 dark:text-white font-semibold">Name</TableHead>
              <TableHead className="text-slate-900 dark:text-white font-semibold">Company</TableHead>
              <TableHead className="text-slate-900 dark:text-white font-semibold">Position</TableHead>
              <TableHead className="text-slate-900 dark:text-white font-semibold">Email</TableHead>
              <TableHead className="text-slate-900 dark:text-white font-semibold">Phone</TableHead>
              <TableHead className="text-slate-900 dark:text-white font-semibold">Seniority</TableHead>
              <TableHead className="text-slate-900 dark:text-white font-semibold">Relationship</TableHead>
              <TableHead className="text-slate-900 dark:text-white font-semibold">Contact Method</TableHead>
              <TableHead className="text-slate-900 dark:text-white font-semibold">Meetings</TableHead>
              <TableHead className="text-right text-slate-900 dark:text-white font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-slate-600 dark:text-slate-400 font-medium">
                  No contacts found. Add your first contact to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableCell className="font-medium text-slate-900 dark:text-white">
                    {contact.first_name} {contact.last_name}
                  </TableCell>
                  <TableCell className="text-slate-800 dark:text-slate-200">{contact.company || '-'}</TableCell>
                  <TableCell className="text-slate-800 dark:text-slate-200">{contact.position || '-'}</TableCell>
                  <TableCell className="text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      {contact.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-800 dark:text-slate-200">
                    {contact.phone || contact.mobile ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        {contact.phone || contact.mobile}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {contact.seniority ? (
                      <Badge variant="outline">
                        {seniorityLevels[contact.seniority]}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={relationshipColors[contact.relationship_strength]}>
                        {contact.relationship_strength}
                      </Badge>
                      <div className="flex gap-0.5">
                        {[...Array(relationshipIcons[contact.relationship_strength])].map((_, i) => (
                          <Heart key={i} className="w-3 h-3 fill-current text-red-500" />
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-800 dark:text-slate-200">
                    {contact.preferred_contact_method ? (
                      <div className="flex items-center gap-2">
                        {contact.preferred_contact_method === 'linkedin' && <Linkedin className="w-4 h-4 text-emerald-600" />}
                        {contact.preferred_contact_method === 'email' && <Mail className="w-4 h-4 text-emerald-600" />}
                        {contact.preferred_contact_method === 'phone' && <Phone className="w-4 h-4 text-emerald-600" />}
                        <span className="capitalize">{contact.preferred_contact_method}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{contact.total_meetings}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900 dark:hover:text-emerald-300"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900 dark:hover:text-red-300"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="w-4 h-4" />
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
  )
}
