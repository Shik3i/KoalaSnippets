"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

interface SiteSettings {
  registrationEnabled: boolean;
  globalAnnouncement: string | null;
  maxSnippetsPerUser: number;
  maxCharsPerSnippet: number;
}

export function AdminSettings() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      addToast("Settings saved successfully", "success");
    } catch {
      addToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="p-4 text-sm text-destructive">Failed to load settings.</div>;
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Site Settings & Quotas</CardTitle>
        <CardDescription>Manage global configuration for KoalaSnippets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 border rounded-md border-border bg-card">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Registration</Label>
            <p className="text-xs text-muted-foreground">Allow new users to sign up for an account.</p>
          </div>
          <Input 
            type="checkbox" 
            className="w-5 h-5 accent-primary" 
            checked={settings.registrationEnabled}
            onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })} 
          />
        </div>

        <div className="space-y-2">
          <Label>Global Announcement</Label>
          <Textarea 
            placeholder="Important server maintenance tonight at 2AM..." 
            value={settings.globalAnnouncement || ""}
            onChange={(e) => setSettings({ ...settings, globalAnnouncement: e.target.value || null })}
          />
          <p className="text-xs text-muted-foreground">Displays a banner at the top of every page for all users.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Max Snippets Per User</Label>
            <Input 
              type="number" 
              min={1} 
              value={settings.maxSnippetsPerUser}
              onChange={(e) => setSettings({ ...settings, maxSnippetsPerUser: parseInt(e.target.value) || 1000 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Characters Per Snippet</Label>
            <Input 
              type="number" 
              min={1000} 
              value={settings.maxCharsPerSnippet}
              onChange={(e) => setSettings({ ...settings, maxCharsPerSnippet: parseInt(e.target.value) || 250000 })}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
