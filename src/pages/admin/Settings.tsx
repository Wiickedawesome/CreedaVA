import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Bell, User, Save, Database, Monitor } from 'lucide-react';
import { toast } from 'sonner';

export function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [leadNotifications, setLeadNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  const handleSaveSettings = () => {
    // Save notification preferences to localStorage
    localStorage.setItem('notifications', JSON.stringify({
      email: emailNotifications,
      leads: leadNotifications,
      tasks: taskReminders
    }));
    localStorage.setItem('compactMode', String(compactMode));
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
    const savedCompactMode = localStorage.getItem('compactMode');
    if (savedCompactMode) {
      setCompactMode(savedCompactMode === 'true');
    }
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">Configure your CRM preferences and account settings</p>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : theme === 'light' ? <Sun className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              Appearance
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Customize how CreedaVA looks for you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-slate-900 dark:text-white font-semibold">Theme</Label>
              <Select value={theme || 'system'} onValueChange={(value) => setTheme(value)}>
                          <SelectTrigger className="w-full bg-white/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                  <SelectItem value="light" className="text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark" className="text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system" className="text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-600 dark:text-slate-400">Choose your preferred theme or sync with system</p>
            </div>
            
            <Separator className="bg-slate-200 dark:bg-slate-800" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-900 dark:text-white font-semibold">Compact Mode</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">Reduce spacing between elements</p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-900 dark:text-white font-semibold">Email Notifications</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">Receive email updates about activity</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            
            <Separator className="bg-slate-200 dark:bg-slate-800" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-900 dark:text-white font-semibold">New Lead Alerts</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">Get notified when new leads are added</p>
              </div>
              <Switch checked={leadNotifications} onCheckedChange={setLeadNotifications} />
            </div>
            
            <Separator className="bg-slate-200 dark:bg-slate-800" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-900 dark:text-white font-semibold">Task Reminders</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">Receive reminders for upcoming tasks</p>
              </div>
              <Switch checked={taskReminders} onCheckedChange={setTaskReminders} />
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-white font-semibold">Email</Label>
              <Input value={user?.email || ''} disabled className="bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" />
              <p className="text-xs text-slate-600 dark:text-slate-400">Your email cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-white font-semibold">Role</Label>
              <Input value={user?.user_metadata?.role || 'Admin'} disabled className="bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" />
              <p className="text-xs text-slate-600 dark:text-slate-400">Contact support to change your role</p>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Database className="w-5 h-5" />
              Database
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Supabase connection status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <Label className="text-slate-900 dark:text-white font-semibold">Connected to Supabase</Label>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Project: {import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'Not configured'}</p>
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
