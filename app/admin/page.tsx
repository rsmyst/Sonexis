"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { IconMicrophone } from "@tabler/icons-react";

interface User {
  id: string;
  userId: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export default function AdminControls() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [newUserId, setNewUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to fetch users");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await processVoiceEnrollment(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus("Recording... Speak now");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setRecordingStatus("Error accessing microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStatus("Processing voice enrollment...");
    }
  };

  const processVoiceEnrollment = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("userId", newUserId);

      const response = await fetch("/api/admin/voice-enroll", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setRecordingStatus("Voice enrollment successful");
        toast.success("Voice enrollment completed");
      } else {
        throw new Error("Voice enrollment failed");
      }
    } catch (error) {
      console.error("Error processing voice enrollment:", error);
      setRecordingStatus("Error processing voice enrollment");
      toast.error("Failed to process voice enrollment");
    }
  };

  const handleAddUser = async () => {
    if (!newUserId) {
      toast.error("Please enter a user ID");
      return;
    }

    setIsEnrolling(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: newUserId,
          isAdmin,
        }),
      });

      if (response.ok) {
        await fetchUsers();
        setNewUserId("");
        setIsAdmin(false);
        toast.success("User added successfully");
      } else {
        toast.error("Failed to add user");
      }
    } catch (err) {
      console.error("Error adding user:", err);
      toast.error("Failed to add user");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isAdmin: currentRole === "USER",
        }),
      });

      if (response.ok) {
        await fetchUsers();
        toast.success("User role updated successfully");
      } else {
        toast.error("Failed to update user role");
      }
    } catch (err) {
      console.error("Error updating user role:", err);
      toast.error("Failed to update user role");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Add New User</Label>
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter user ID"
                    value={newUserId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewUserId(e.target.value)
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
                    <Label>Admin</Label>
                  </div>
                  <Button onClick={handleAddUser} disabled={isEnrolling}>
                    {isEnrolling ? "Enrolling..." : "Add User"}
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-4 rounded-full ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-[#694A38] hover:bg-[#5a3f30]"
                    } transition-colors`}
                    disabled={!newUserId}
                  >
                    <IconMicrophone size={24} className="theme-text-accent" />
                  </Button>
                  {recordingStatus && (
                    <p className="text-sm text-gray-500">{recordingStatus}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label>User List</Label>
              <div className="mt-4 space-y-4">
                {users.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{user.userId}</p>
                          <p className="text-sm text-gray-500">
                            Created: {formatDate(user.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.role === "ADMIN"}
                              onCheckedChange={() =>
                                handleToggleAdmin(user.id, user.role)
                              }
                            />
                            <Label>Admin</Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
