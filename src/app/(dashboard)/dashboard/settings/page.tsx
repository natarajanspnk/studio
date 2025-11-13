'use client';
export const dynamic = 'force-dynamic';
import { useTheme } from 'next-themes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const toggleTheme = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    setIsDarkMode(checked);
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Settings
        </h2>
        <p className="mt-2 text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode-switch" className="flex flex-col gap-1">
                <span>Dark Mode</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Enable to switch to a darker theme.
                </span>
              </Label>
               <Switch
                id="dark-mode-switch"
                checked={isDarkMode}
                onCheckedChange={toggleTheme}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
