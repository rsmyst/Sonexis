"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UserSettings {
  language: string;
  voiceEnabled: boolean;
  autoSuggestEnabled: boolean;
}

export default function AccountSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    if (session?.user?.id) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/user/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error("Failed to fetch settings");
    }
  };

  const handleEdit = (field: string, value: string) => {
    setIsEditing(field);
    setEditValue(value);
  };

  const handleSave = async (field: string) => {
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: editValue,
        }),
      });

      if (response.ok) {
        await fetchSettings();
        setIsEditing(null);
        toast.success("Settings updated successfully");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      toast.error("Failed to update settings");
    }
  };

  const handleToggle = async (field: "voiceEnabled" | "autoSuggestEnabled") => {
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: !settings?.[field],
        }),
      });

      if (response.ok) {
        await fetchSettings();
        toast.success("Settings updated successfully");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      toast.error("Failed to update settings");
    }
  };

  if (!settings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email</Label>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Language</Label>
                {isEditing === "language" ? (
                  <div className="flex gap-2">
                    <Input
                      value={editValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditValue(e.target.value)
                      }
                      className="w-32"
                    />
                    <Button onClick={() => handleSave("language")}>Save</Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">{settings.language}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit("language", settings.language)}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Voice Recognition</Label>
                <p className="text-sm text-gray-500">
                  Enable/disable voice recognition
                </p>
              </div>
              <Switch
                checked={settings.voiceEnabled}
                onCheckedChange={() => handleToggle("voiceEnabled")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Suggestions</Label>
                <p className="text-sm text-gray-500">
                  Enable/disable query suggestions
                </p>
              </div>
              <Switch
                checked={settings.autoSuggestEnabled}
                onCheckedChange={() => handleToggle("autoSuggestEnabled")}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
