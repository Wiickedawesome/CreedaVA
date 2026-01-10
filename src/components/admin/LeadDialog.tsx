import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, UserPlus, Mail, Phone, Calendar, Tag, Star, DollarSign, Building2 } from 'lucide-react';

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.string().min(1, 'Lead source is required'),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']),
  score: z.number().min(0).max(100),
  estimatedValue: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

export interface Lead {
  id: string;
  type: string;
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
  createdAt: string;
  updatedAt?: string;
}

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSave: (lead: LeadFormData) => Promise<void>;
  mode: 'create' | 'edit' | 'view';
}

const leadSources = [
  'Website Contact Form',
  'Social Media',
  'Email Campaign',
  'Google Ads',
  'Facebook Ads',
  'LinkedIn',
  'Referral',
  'Cold Outreach',
  'Trade Show',
  'Content Marketing',
  'SEO',
  'Other'
];

const leadStages = [
  { value: 'new', label: 'New Lead', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
  { value: 'proposal', label: 'Proposal Sent', color: 'bg-orange-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-pink-500' },
  { value: 'closed-won', label: 'Closed Won', color: 'bg-green-500' },
  { value: 'closed-lost', label: 'Closed Lost', color: 'bg-red-500' },
];

export function LeadDialog({ open, onOpenChange, lead, onSave, mode }: LeadDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: lead?.name || '',
      email: lead?.email || '',
      phone: lead?.phone || '',
      company: lead?.company || '',
      position: lead?.position || '',
      source: lead?.source || '',
      stage: (lead?.stage as any) || 'new',
      score: lead?.score || 50,
      estimatedValue: lead?.estimatedValue || 0,
      notes: lead?.notes || '',
    },
  });

  // Reset form when lead changes
  useState(() => {
    if (lead) {
      form.reset({
        name: lead.name,
        email: lead.email,
        phone: lead.phone || '',
        company: lead.company || '',
        position: lead.position || '',
        source: lead.source,
        stage: lead.stage as any,
        score: lead.score,
        estimatedValue: lead.estimatedValue || 0,
        notes: lead.notes || '',
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        source: '',
        stage: 'new',
        score: 50,
        estimatedValue: 0,
        notes: '',
      });
    }
  }, [lead, open]);

  const handleSubmit = async (data: LeadFormData) => {
    try {
      setLoading(true);
      await onSave(data);
      onOpenChange(false);
      if (mode === 'create') {
        form.reset();
      }
    } catch (error) {
      console.error('Error saving lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';
  const title = mode === 'create' ? 'Add New Lead' : mode === 'edit' ? 'Edit Lead' : 'Lead Details';
  const description = mode === 'create' 
    ? 'Add a new lead to your pipeline' 
    : mode === 'edit' 
    ? 'Update lead information and stage'
    : 'View detailed lead information and history';

  const getStageColor = (stage: string) => {
    const stageInfo = leadStages.find(s => s.value === stage);
    return stageInfo?.color || 'bg-gray-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <UserPlus className="h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">{description}</DialogDescription>
        </DialogHeader>

        {mode === 'view' ? (
          <div className="space-y-6">
            {/* Lead Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <UserPlus className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Lead Score</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className={`h-5 w-5 ${getScoreColor(lead?.score || 0)}`} />
                  <span className={`text-2xl font-bold ${getScoreColor(lead?.score || 0)}`}>
                    {lead?.score || 0}
                  </span>
                  <span className="text-gray-400">/ 100</span>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Stage</span>
                </div>
                <Badge className={`${getStageColor(lead?.stage || 'new')} text-white`}>
                  {leadStages.find(s => s.value === lead?.stage)?.label || lead?.stage}
                </Badge>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Estimated Value</span>
                </div>
                <p className="text-2xl font-bold text-green-400">
                  ${lead?.estimatedValue?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <UserPlus className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Name</span>
                </div>
                <p className="font-medium text-white">{lead?.name}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Email</span>
                </div>
                <p className="font-medium text-white">{lead?.email}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Phone</span>
                </div>
                <p className="font-medium text-white">{lead?.phone || 'Not provided'}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Company</span>
                </div>
                <p className="font-medium text-white">{lead?.company || 'Not specified'}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Position</span>
                </div>
                <p className="font-medium text-white">{lead?.position || 'Not specified'}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Source</span>
                </div>
                <Badge variant="secondary">{lead?.source}</Badge>
              </div>
            </div>

            {/* Notes */}
            {lead?.notes && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-sm font-medium text-gray-300">Notes</span>
                </div>
                <p className="text-gray-100 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Timeline</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Created: {lead?.createdAt && new Date(lead.createdAt).toLocaleString()}
                </p>
                {lead?.updatedAt && (
                  <p className="text-sm text-gray-400">
                    Last Updated: {new Date(lead.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter full name"
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="Enter email address"
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel"
                          placeholder="Enter phone number"
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter company name"
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position/Title</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter job title or position"
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Source *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select lead source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leadSources.map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Lead Qualification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pipeline Stage *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leadStages.map((stage) => (
                            <SelectItem key={stage.value} value={stage.value}>
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Score (0-100)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="0"
                          max="100"
                          placeholder="50"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Value ($)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="0"
                          placeholder="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter notes about this lead..."
                        className="min-h-[120px]"
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {mode !== 'view' && (
            <Button type="submit" onClick={form.handleSubmit(handleSubmit)} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Add Lead' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}