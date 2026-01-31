import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Upload, Camera, Check, X, Loader2 } from "lucide-react";
import axios from "axios";

// Cloudinary config
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset";

interface UserProfile {
  displayName: string;
  email: string;
  studentId: string;
  photoURL?: string;
  bio?: string;
  team?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    displayName: "",
    email: "",
    studentId: "",
    photoURL: "",
    bio: "",
    team: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Load user profile
  useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            setProfile(userData);
            setFormData(userData);
            setPhotoPreview(userData.photoURL || "");
          }
        } catch (error) {
          console.error("Error loading profile:", error);
          setMessage({ type: "error", text: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้" });
        }
      };
      loadProfile();
    }
  }, [user]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await axios.post(CLOUDINARY_URL, formData);
      const cloudinaryUrl = res.data.secure_url;
      
      setFormData({ ...formData, photoURL: cloudinaryUrl });
      setMessage({ type: "success", text: "อัปโหลดรูปภาพสำเร็จ" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error uploading photo:", error);
      setMessage({ type: "error", text: "ไม่สามารถอัปโหลดรูปภาพได้" });
      setPhotoPreview(profile?.photoURL || "");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !auth.currentUser) return;
    
    setIsSaving(true);
    try {
      // Prepare auth profile update (only include non-empty values)
      const authUpdate: any = {};
      if (formData.displayName) authUpdate.displayName = formData.displayName;
      if (formData.photoURL) authUpdate.photoURL = formData.photoURL;
      
      // Update Firebase Auth profile
      if (Object.keys(authUpdate).length > 0) {
        await updateProfile(auth.currentUser, authUpdate);
      }

      // Update Firestore document (ensure no undefined values)
      const firestoreData: any = {
        displayName: formData.displayName || "",
        email: formData.email || "",
        studentId: formData.studentId || "",
        photoURL: formData.photoURL || "",
        bio: formData.bio || "",
        team: formData.team || "",
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(doc(db, "users", user.uid), firestoreData);

      setProfile(formData);
      setIsEditing(false);
      setMessage({ type: "success", text: "บันทึกข้อมูลเรียบร้อยแล้ว" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลได้";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-display font-bold text-white mb-8">โปรไฟล์ของฉัน</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-500/20 border border-green-500/50 text-green-300"
                : "bg-red-500/20 border border-red-500/50 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <Card className="bg-card/50 border-white/10 p-8">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <img
                src={photoPreview || profile.photoURL || "https://via.placeholder.com/150"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
              />
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="absolute bottom-0 right-0 bg-primary p-2 rounded-full hover:bg-primary/80 transition disabled:opacity-50"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={isUploadingPhoto}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {isEditing ? "คลิกกล้องเพื่อเปลี่ยนรูปโปรไฟล์" : profile.displayName}
            </p>
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">ชื่อ-นามสกุล</label>
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={!isEditing}
                className="bg-white/5 border-white/10 disabled:opacity-50"
                placeholder="ชื่อ-นามสกุล"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">อีเมล</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className="bg-white/5 border-white/10 disabled:opacity-50"
                placeholder="example@email.com"
              />
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">รหัสนักศึกษา</label>
              <Input
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                disabled={!isEditing}
                className="bg-white/5 border-white/10 disabled:opacity-50"
                placeholder="รหัสนักศึกษา"
              />
            </div>

            {/* Team */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">ทีม</label>
              <Input
                value={formData.team || ""}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                disabled={!isEditing}
                className="bg-white/5 border-white/10 disabled:opacity-50"
                placeholder="ชื่อทีมของคุณ"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">ประวัติส่วนตัว</label>
              <textarea
                value={formData.bio || ""}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-muted-foreground disabled:opacity-50 resize-none"
                placeholder="เขียนเกี่ยวกับตัวคุณ..."
                rows={4}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-primary hover:bg-primary/80"
              >
                แก้ไขข้อมูล
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving || isUploadingPhoto}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      บันทึก
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(profile);
                    setPhotoPreview(profile.photoURL || "");
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isSaving || isUploadingPhoto}
                >
                  <X className="w-4 h-4 mr-2" />
                  ยกเลิก
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
