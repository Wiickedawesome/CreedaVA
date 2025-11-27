import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Bell, User, Save, Database } from 'lucide-react';
import { toast } from 'sonner';

export function Settings() {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [leadNotifications, setLeadNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);

  const handleSaveSettings = () => {
    // Save notification preferences to localStorage
    localStorage.setItem('notifications', JSON.stringify({
      email: emailNotifications,
      leads: leadNotifications,
      tasks: taskReminders
    }));
    toast.success('Settings saved successfully!');
  };

  useEffect(() => {
    // Load saved notification preferences
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      const prefs = JSON.parse(savedNotifications);
      setEmailNotifications(prefs.email ?? true);
      setLeadNotifications(prefs.leads ?? true);
      setTaskReminders(prefs.tasks ?? true);
    }
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-300 mt-2">Configure your CRM preferences and account settings</p>
      </div>

      <div className="space-y-6">
        {/* Notification Settings */}
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription className="text-gray-300">Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white font-semibold">Email Notifications</Label>
                <p className="text-sm text-gray-300">Receive email updates about activity</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            
            <Separator className="bg-gray-600" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white font-semibold">New Lead Alerts</Label>
                <p className="text-sm text-gray-300">Get notified when new leads are added</p>
              </div>
              <Switch checked={leadNotifications} onCheckedChange={setLeadNotifications} />
            </div>
            
            <Separator className="bg-gray-600" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white font-semibold">Task Reminders</Label>
                <p className="text-sm text-gray-300">Receive reminders for upcoming tasks</p>
              </div>
              <Switch checked={taskReminders} onCheckedChange={setTaskReminders} />
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription className="text-gray-300">Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white font-semibold">Email</Label>
              <Input value={user?.email || ''} disabled className="bg-gray-800 border-gray-600 text-gray-300" />
              <p className="text-xs text-gray-400">Your email cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-white font-semibold">Role</Label>
              <Input value={user?.user_metadata?.role || 'Admin'} disabled className="bg-gray-800 border-gray-600 text-gray-300" />
              <p className="text-xs text-gray-400">Contact support to change your role</p>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="w-5 h-5" />
              Database
            </CardTitle>
            <CardDescription className="text-gray-300">Supabase connection status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <Label className="text-white font-semibold">Connected to Supabase</Label>
              </div>
              <p className="text-sm text-gray-300">Project: {import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'Not configured'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
            <Button onClick={handleSaveSettings} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/40 dark:bg-emerald-500 dark:hover:bg-emerald-600">
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
