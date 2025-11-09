"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updatePasswordSchema,
  updateProfileSchema,
  type UpdatePasswordData,
  type UpdateProfileData,
} from "@/lib/validations/account";
import {
  updatePassword,
  updateProfile,
  signOut,
  type UserProfile,
} from "@/actions/account-actions";
import { useOddsFormat } from "@/lib/odds-format-context";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountSettingsFormProps {
  timezones: Array<{ value: string; label: string }>;
}

export function AccountSettingsForm({ timezones }: AccountSettingsFormProps) {
  const { format, setFormat } = useOddsFormat();
  const initialProfile = useUser();
  const [passwordMessage, setPasswordMessage] = useState<string>("");
  const [profileMessage, setProfileMessage] = useState<string>("");
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [pendingPassword, setPendingPassword] = useState<UpdatePasswordData | null>(null);

  const passwordForm = useForm<UpdatePasswordData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const profileForm = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nickname: initialProfile.nickname || "",
      timezone: initialProfile.timezone,
      preferredOddsFormat: initialProfile.preferredOddsFormat,
    },
  });

  const handlePasswordSubmit = async (data: UpdatePasswordData) => {
    setPendingPassword(data);
    setShowPasswordConfirm(true);
  };

  const confirmPasswordChange = async () => {
    if (!pendingPassword) return;
    
    setShowPasswordConfirm(false);
    setIsLoadingPassword(true);
    setPasswordMessage("");
    try {
      const result = await updatePassword(pendingPassword);
      setPasswordMessage(result.message);
      passwordForm.reset();
      setPendingPassword(null);
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleProfileChange = async (field: keyof UpdateProfileData, value: any) => {
    setIsLoadingProfile(true);
    setProfileMessage("");
    try {
      const result = await updateProfile({ [field]: value });
      setProfileMessage(result.message);
      // Update form state to reflect the change
      profileForm.setValue(field, value);
      if (field === "preferredOddsFormat") {
        setFormat(value);
      }
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Profile Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your profile settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                {...profileForm.register("nickname")}
                onBlur={(e) => {
                  if (e.target.value !== initialProfile.nickname) {
                    handleProfileChange("nickname", e.target.value || null);
                  }
                }}
                className={profileForm.formState.errors.nickname ? "border-destructive" : ""}
              />
              {profileForm.formState.errors.nickname && (
                <p className="text-sm text-destructive">
                  {profileForm.formState.errors.nickname.message}
                </p>
              )}
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={profileForm.watch("timezone")}
                onValueChange={(value) => handleProfileChange("timezone", value)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Odds Format */}
            <div className="space-y-2">
              <Label>Odds Format</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={format === "decimal" ? "default" : "outline"}
                  onClick={() => handleProfileChange("preferredOddsFormat", "decimal")}
                  className="flex-1"
                >
                  Decimal
                </Button>
                <Button
                  type="button"
                  variant={format === "american" ? "default" : "outline"}
                  onClick={() => handleProfileChange("preferredOddsFormat", "american")}
                  className="flex-1"
                >
                  American
                </Button>
              </div>
            </div>

            {profileMessage && (
              <p className={`text-sm ${profileMessage.includes("error") || profileMessage.includes("Failed") ? "text-destructive" : "text-green-500"}`}>
                {profileMessage}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...passwordForm.register("password")}
                  className={passwordForm.formState.errors.password ? "border-destructive" : ""}
                />
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...passwordForm.register("confirmPassword")}
                  className={passwordForm.formState.errors.confirmPassword ? "border-destructive" : ""}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </p>
              <Button type="submit" disabled={isLoadingPassword}>
                {isLoadingPassword ? "Updating..." : "Update Password"}
              </Button>
              {passwordMessage && (
                <p className={`text-sm ${passwordMessage.includes("error") || passwordMessage.includes("Failed") ? "text-destructive" : "text-green-500"}`}>
                  {passwordMessage}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Sign Out Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Sign Out</CardTitle>
            <CardDescription>Sign out of your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleSignOut} className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Password Confirmation Dialog */}
      <Dialog open={showPasswordConfirm} onOpenChange={setShowPasswordConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Password Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change your password? You will need to use your new password to sign in next time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPasswordChange} disabled={isLoadingPassword}>
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

