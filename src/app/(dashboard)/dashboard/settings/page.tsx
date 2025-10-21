'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { setTheme, theme } = useTheme();

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
              <Label htmlFor="theme-selector">Theme</Label>
              <div
                id="theme-selector"
                className="flex items-center gap-2 rounded-lg border p-1"
              >
                <Button
                  variant={theme === 'light' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-5 w-5" />
                  <span className="sr-only">Light</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-5 w-5" />
                  <span className="sr-only">Dark</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="h-5 w-5" />
                  <span className="sr-only">System</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
