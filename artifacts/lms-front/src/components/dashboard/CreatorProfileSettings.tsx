import { useEffect, useState } from "react";
import { Camera, Globe, Save, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetCreatorProfileQueryKey,
  useFinalizeCreatorAvatarUpload,
  useGetCreatorProfile,
  useRequestCreatorAvatarUpload,
  useUpdateCreatorProfile,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function CreatorProfileSettings() {
  const { data: profile, isLoading } = useGetCreatorProfile();
  const updateProfile = useUpdateCreatorProfile();
  const requestAvatarUpload = useRequestCreatorAvatarUpload();
  const finalizeAvatarUpload = useFinalizeCreatorAvatarUpload();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ displayName: "", username: "", headline: "", bio: "", websiteUrl: "" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      displayName: profile.displayName || "",
      username: profile.username || "",
      headline: profile.headline || "",
      bio: profile.bio || "",
      websiteUrl: profile.websiteUrl || "",
    });
    setAvatarPreview(profile.avatarUrl || null);
  }, [profile]);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = () => {
    updateProfile.mutate({ data: form }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetCreatorProfileQueryKey(), updated);
        toast({ title: "Creator profile updated." });
      },
      onError: (error: any) => {
        toast({ title: error?.data?.error || error?.response?.data?.error || "Could not update profile.", variant: "destructive" });
      },
    });
  };

  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({ title: "Choose a JPG, PNG or WebP image up to 5MB.", variant: "destructive" });
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    try {
      const { uploadURL, objectPath } = await requestAvatarUpload.mutateAsync({
        data: { filename: file.name, mimeType: file.type, sizeBytes: file.size },
      });
      const upload = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!upload.ok) throw new Error("Profile image upload failed");
      const updated = await finalizeAvatarUpload.mutateAsync({ data: { objectPath } });
      queryClient.setQueryData(getGetCreatorProfileQueryKey(), updated);
      setAvatarPreview(updated.avatarUrl || localPreview);
      toast({ title: "Profile photo updated." });
    } catch (error: any) {
      setAvatarPreview(profile?.avatarUrl || null);
      toast({ title: error?.message || "Could not upload profile photo.", variant: "destructive" });
    } finally {
      URL.revokeObjectURL(localPreview);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  const pending = updateProfile.isPending || requestAvatarUpload.isPending || finalizeAvatarUpload.isPending;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pt-4">
      <div>
        <h2 className="text-[32px] font-bold tracking-tight text-black md:text-[40px]">Creator Profile</h2>
        <p className="mt-1 text-[16px] text-[#4D4D4D]">Control the name, photo and information buyers see on your products.</p>
      </div>

      <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 border-b border-[#E8E8E8] pb-8 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#E6F6ED] shadow-md">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Creator profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center"><UserRound className="h-12 w-12 text-[#70A88D]" /></div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-black">Profile photo</h3>
            <p className="mt-1 text-sm text-[#666]">Use a clear square image. JPG, PNG or WebP up to 5MB.</p>
            <Label htmlFor="creator-avatar" className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#123D32] px-4 text-sm font-semibold text-white hover:bg-[#0B3027]">
              <Camera className="h-4 w-4" /> Change photo
            </Label>
            <Input id="creator-avatar" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={pending} onChange={(event) => {
              void uploadAvatar(event.target.files?.[0]);
              event.target.value = "";
            }} />
          </div>
        </div>

        <div className="grid gap-6 pt-8 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" value={form.displayName} onChange={(event) => setField("displayName", event.target.value)} maxLength={80} placeholder="Your public name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex overflow-hidden rounded-md border border-input">
              <span className="flex items-center bg-[#F7F7F7] px-3 text-sm text-[#737373]">@</span>
              <Input id="username" value={form.username} onChange={(event) => setField("username", event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} maxLength={30} className="border-0 focus-visible:ring-0" placeholder="your_username" />
            </div>
            <p className="text-xs text-[#737373]">Lowercase letters, numbers and underscores only.</p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="headline">Professional headline</Label>
            <Input id="headline" value={form.headline} onChange={(event) => setField("headline", event.target.value)} maxLength={140} placeholder="e.g. Wellness educator and business mentor" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bio">About you</Label>
            <Textarea id="bio" value={form.bio} onChange={(event) => setField("bio", event.target.value)} maxLength={1500} rows={6} placeholder="Tell learners about your experience and expertise." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-[#737373]" />
              <Input id="websiteUrl" value={form.websiteUrl} onChange={(event) => setField("websiteUrl", event.target.value)} maxLength={500} className="pl-9" placeholder="https://yourwebsite.com" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end border-t border-[#E8E8E8] pt-6">
          <Button onClick={save} disabled={pending || form.displayName.trim().length < 2 || form.username.length < 3} className="h-11 bg-primary px-6 text-white hover:bg-[#10A364]">
            <Save className="mr-2 h-4 w-4" /> {updateProfile.isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </section>
    </div>
  );
}