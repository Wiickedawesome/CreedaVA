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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your CRM preferences and account settings</p>
      </div>

      <div className="space-y-6">
        {/* Notification Settings */}
        <Card className="p-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Bell className="w-5 h-5 text-blue-400" />
              Notifications
            </CardTitle>
            <CardDescription className="text-gray-400">Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white text-sm font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-400">Receive email updates about activity</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            
            <Separator className="bg-gray-600" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white font-semibold">New Lead Alerts</Label>
                <p className="text-sm text-gray-400">Get notified when new leads are added</p>
              </div>
              <Switch checked={leadNotifications} onCheckedChange={setLeadNotifications} />
            </div>
            
            <Separator className="bg-gray-600" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white font-semibold">Task Reminders</Label>
                <p className="text-sm text-gray-400">Receive reminders for upcoming tasks</p>
              </div>
              <Switch checked={taskReminders} onCheckedChange={setTaskReminders} />
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="p-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <User className="w-5 h-5 text-green-400" />
              Profile
            </CardTitle>
            <CardDescription className="text-gray-400">Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white font-semibold">Email</Label>
              <Input value={user?.email || ''} disabled className="bg-gray-800 border-gray-600 text-gray-400" />
              <p className="text-xs text-gray-400">Your email cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-white font-semibold">Role</Label>
              <Input value={user?.user_metadata?.role || 'Admin'} disabled className="bg-gray-800 border-gray-600 text-gray-400" />
              <p className="text-xs text-gray-400">Contact support to change your role</p>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card className="p-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Database className="w-5 h-5 text-purple-400" />
              Database
            </CardTitle>
            <CardDescription className="text-gray-400">Supabase connection status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <Label className="text-white font-semibold">Connected to Azure Cosmos DB</Label>
              </div>
              <p className="text-sm text-gray-400">Endpoint: {import.meta.env.VITE_COSMOS_ENDPOINT?.split('//')[1]?.split('.')[0] || 'Not configured'}</p>
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
