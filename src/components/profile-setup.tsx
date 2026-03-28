"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useGetUserProfileQuery, useCreateUserProfileMutation, useUpdateUserProfileMutation } from "@/store/api";

interface UserProfile {
  userId: string;
  mumblesVibeName: string;
  createdAt: string;
}

export function ProfileSetup() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [vibeName, setVibeName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useGetUserProfileQuery(undefined, { skip: !isAuthenticated });

  const [createProfile, { isLoading: isCreating }] = useCreateUserProfileMutation();

  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibeName.trim()) return;
    
    if (profile) {
      updateProfile({ mumblesVibeName: vibeName.trim() })
        .unwrap()
        .then(() => {
          setIsEditing(false);
          toast({ title: "Profile Updated", description: "Your Mumbles Vibe Name has been updated." });
        })
        .catch(() => {
          toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        });
    } else {
      createProfile({ mumblesVibeName: vibeName.trim() })
        .unwrap()
        .then(() => {
          toast({ title: "Welcome to Mumbles Vibe!", description: "Your profile has been created." });
        })
        .catch(() => {
          toast({ title: "Error", description: "Failed to create profile.", variant: "destructive" });
        });
    }
  };

  if (!isAuthenticated || isLoading) return null;

  const showSetupDialog = !profile && isAuthenticated;
  const isPending = isCreating || isUpdating;

  if (showSetupDialog) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-profile-setup">
          <DialogHeader>
            <DialogTitle>Welcome to Mumbles Vibe!</DialogTitle>
            <DialogDescription>
              Choose your Mumbles Vibe Name - this will be shown on your comments and interactions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="vibeName">Your Mumbles Vibe Name</Label>
              <Input
                id="vibeName"
                value={vibeName}
                onChange={(e) => setVibeName(e.target.value)}
                placeholder="e.g., Seaside Sarah, Mumbles Mike..."
                required
                minLength={2}
                maxLength={50}
                data-testid="input-vibe-name"
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-full" data-testid="button-save-profile">
              {isPending ? "Saving..." : "Join the Vibe"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (isEditing) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Your Vibe Name</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="vibeName">Your Mumbles Vibe Name</Label>
              <Input
                id="vibeName"
                value={vibeName}
                onChange={(e) => setVibeName(e.target.value)}
                placeholder={profile?.mumblesVibeName}
                required
                minLength={2}
                maxLength={50}
                data-testid="input-vibe-name-edit"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1" data-testid="button-update-profile">
                {isPending ? "Saving..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

export function useProfile() {
  const { isAuthenticated } = useAuth();
  
  const { data: profile } = useGetUserProfileQuery(undefined, { skip: !isAuthenticated });

  return { profile, hasProfile: !!profile };
}
