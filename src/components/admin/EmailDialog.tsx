import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Mail, Send, Clock, Users, Target, Eye, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmailCampaign {
  id: string;
  type: 'email';
  name: string;
  subject: string;
  content: string;
  status: string;
  template: string;
  audience: string;
  scheduledDate?: string;
  sentDate?: string;
  recipientCount: number;
  openRate?: number;
  clickRate?: number;
  tags?: string;
  previewText?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: EmailCampaign | null;
  onSave: (email: Omit<EmailCampaign, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => void;
  mode: 'create' | 'edit' | 'view';
}

const emailStatuses = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' },
  { value: 'sending', label: 'Sending', color: 'bg-orange-500' },
  { value: 'sent', label: 'Sent', color: 'bg-green-500' },
  { value: 'paused', label: 'Paused', color: 'bg-yellow-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
];

const emailTemplates = [
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'promotion', label: 'Promotional' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'welcome', label: 'Welcome Series' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'custom', label: 'Custom Template' },
];

const audienceOptions = [
  { value: 'all-subscribers', label: 'All Subscribers' },
  { value: 'new-leads', label: 'New Leads' },
  { value: 'active-customers', label: 'Active Customers' },
  { value: 'inactive-users', label: 'Inactive Users' },
  { value: 'vip-customers', label: 'VIP Customers' },
  { value: 'custom-segment', label: 'Custom Segment' },
];

export function EmailDialog({ open, onOpenChange, email, onSave, mode }: EmailDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    status: 'draft',
    template: 'newsletter',
    audience: 'all-subscribers',
    recipientCount: 0,
    scheduledDate: '',
    tags: '',
    previewText: '',
    fromName: 'CreedaVA',
    fromEmail: 'noreply@creedava.com',
    replyTo: 'support@creedava.com',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isScheduled, setIsScheduled] = useState(false);

  useEffect(() => {
    if (email && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: email.name || '',
        subject: email.subject || '',
        content: email.content || '',
        status: email.status || 'draft',
        template: email.template || 'newsletter',
        audience: email.audience || 'all-subscribers',
        recipientCount: email.recipientCount || 0,
        scheduledDate: email.scheduledDate ? email.scheduledDate.split('T')[0] : '',
        tags: email.tags || '',
        previewText: email.previewText || '',
        fromName: email.fromName || 'CreedaVA',
        fromEmail: email.fromEmail || 'noreply@creedava.com',
        replyTo: email.replyTo || 'support@creedava.com',
      });
      setIsScheduled(!!email.scheduledDate);
    } else if (mode === 'create') {
      setFormData({
        name: '',
        subject: '',
        content: '',
        status: 'draft',
        template: 'newsletter',
        audience: 'all-subscribers',
        recipientCount: 0,
        scheduledDate: '',
        tags: '',
        previewText: '',
        fromName: 'CreedaVA',
        fromEmail: 'noreply@creedava.com',
        replyTo: 'support@creedava.com',
      });
      setIsScheduled(false);
    }
    setErrors({});
  }, [email, mode, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject line is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Email content is required';
    }

    if (!formData.fromEmail.includes('@')) {
      newErrors.fromEmail = 'Valid email address is required';
    }

    if (isScheduled && !formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    }

    if (isScheduled && formData.scheduledDate && new Date(formData.scheduledDate) < new Date()) {
      newErrors.scheduledDate = 'Scheduled date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        name: formData.name,
        subject: formData.subject,
        content: formData.content,
        status: isScheduled ? 'scheduled' : formData.status,
        template: formData.template,
        audience: formData.audience,
        recipientCount: formData.recipientCount,
        scheduledDate: isScheduled && formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : undefined,
        sentDate: formData.status === 'sent' ? new Date().toISOString() : undefined,
        tags: formData.tags,
        previewText: formData.previewText,
        fromName: formData.fromName,
        fromEmail: formData.fromEmail,
        replyTo: formData.replyTo,
      });
      onOpenChange(false);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {mode === 'create' ? 'Create Email Campaign' : mode === 'edit' ? 'Edit Campaign' : 'Campaign Details'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {mode === 'create'
              ? 'Create a new email campaign with content and audience targeting'
              : mode === 'edit'
              ? 'Update campaign content and settings'
              : 'View campaign details and performance metrics'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'view' && email && (
          <div className="space-y-6">
            {/* Campaign Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Status</span>
                </div>
                <Badge 
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    emailStatuses.find(s => s.value === email.status)?.color || 'bg-gray-500'
                  )}
                >
                  {emailStatuses.find(s => s.value === email.status)?.label || email.status}
                </Badge>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Recipients</span>
                </div>
                <p className="text-white font-medium">{email.recipientCount.toLocaleString()}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Open Rate</span>
                </div>
                <p className="text-white font-medium">{email.openRate ? `${email.openRate}%` : 'N/A'}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Click Rate</span>
                </div>
                <p className="text-white font-medium">{email.clickRate ? `${email.clickRate}%` : 'N/A'}</p>
              </div>
            </div>

            {/* Campaign Details */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Campaign Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Subject Line</Label>
                  <p className="text-white mt-1">{email.subject}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-300">Preview Text</Label>
                  <p className="text-gray-400 mt-1">{email.previewText || 'Not set'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-300">Content</Label>
                  <div className="bg-gray-700 p-4 rounded-lg mt-1 max-h-40 overflow-y-auto">
                    <p className="text-gray-300 whitespace-pre-wrap">{email.content}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300">From</Label>
                    <p className="text-white mt-1">{email.fromName} &lt;{email.fromEmail}&gt;</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Reply To</Label>
                    <p className="text-white mt-1">{email.replyTo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(mode === 'create' || mode === 'edit') && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Campaign Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter campaign name"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Template</Label>
                <Select value={formData.template} onValueChange={(value) => setFormData({ ...formData, template: value })} disabled={isReadOnly}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {emailTemplates.map((template) => (
                      <SelectItem key={template.value} value={template.value} className="text-white">
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Subject Line *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter email subject"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={isReadOnly}
              />
              {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Preview Text</Label>
              <Input
                value={formData.previewText}
                onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                placeholder="Text shown in email previews"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={isReadOnly}
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Email Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Email body content"
                rows={8}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={isReadOnly}
              />
              {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Audience</Label>
                <Select value={formData.audience} onValueChange={(value) => setFormData({ ...formData, audience: value })} disabled={isReadOnly}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {audienceOptions.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value} className="text-white">
                        {audience.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Estimated Recipients</Label>
                <Input
                  type="number"
                  value={formData.recipientCount}
                  onChange={(e) => setFormData({ ...formData, recipientCount: parseInt(e.target.value) || 0 })}
                  placeholder="Number of recipients"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">From Name</Label>
                <Input
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  placeholder="Sender name"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">From Email *</Label>
                <Input
                  type="email"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  placeholder="sender@example.com"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
                {errors.fromEmail && <p className="text-red-400 text-xs mt-1">{errors.fromEmail}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Reply To</Label>
                <Input
                  type="email"
                  value={formData.replyTo}
                  onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
                  placeholder="reply@example.com"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Switch 
                  checked={isScheduled} 
                  onCheckedChange={setIsScheduled}
                  disabled={isReadOnly}
                />
                <Label className="text-sm font-medium text-gray-300">Schedule for later</Label>
              </div>

              {isScheduled && (
                <div>
                  <Label className="text-sm font-medium text-gray-300">Scheduled Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={isReadOnly}
                  />
                  {errors.scheduledDate && <p className="text-red-400 text-xs mt-1">{errors.scheduledDate}</p>}
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Tags</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Comma-separated tags (e.g., newsletter, promo, welcome)"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={isReadOnly}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <>
              <Button
                onClick={handleSave}
                variant="outline"
                className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                Save Draft
              </Button>
              <Button
                onClick={() => {
                  setFormData({ ...formData, status: 'sending' });
                  handleSave();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isScheduled ? 'Schedule Campaign' : 'Send Now'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}