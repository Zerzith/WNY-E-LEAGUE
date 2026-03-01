import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AvatarCustom } from "@/components/ui/avatar-custom";
import { Loader2, Upload, Camera, Save, X, ArrowLeft } from "lucide-react";
import axios from "axios";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "djubsqri6";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "wangnamyenesport";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

interface Member {
  name: string;
  gameName: string;
  grade: string;
  department: string;
  studentId: string;
  phone: string;
  email: string;
}

interface Registration {
  id: string;
  teamName: string;
  game: string;
  gameMode: string;
  logoUrl: string;
  members: Member[];
  status: string;
}

export default function EditRegistration() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { registrationId } = useParams();
  const { toast } = useToast();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [teamName, setTeamName] = useState("");
  const [gameMode, setGameMode] = useState("");
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!user || !registrationId) {
      setLocation("/my-teams");
      return;
    }

    const fetchRegistration = async () => {
      try {
        const docRef = doc(db, "registrations", registrationId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          toast({ title: "ไม่พบข้อมูลการสมัคร", variant: "destructive" });
          setLocation("/my-teams");
          return;
        }

        const data = docSnap.data() as Registration;
        
        // Check if user is the one who registered
        if (data.userId !== user.uid) {
          toast({ title: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้", variant: "destructive" });
          setLocation("/my-teams");
          return;
        }

        setRegistration({ ...data, id: registrationId });
        setTeamName(data.teamName);
        setGameMode(data.gameMode || "");
        setMembers(data.members || []);
        setLogoPreview(data.logoUrl);
        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching registration:", error);
        toast({ title: "เกิดข้อผิดพลาดในการโหลดข้อมูล", variant: "destructive" });
        setLocation("/my-teams");
      }
    };

    fetchRegistration();
  }, [user, registrationId, setLocation, toast]);

  const handleLogoChange = (file: File | null) => {
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    if (!logoFile || !registration) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("file", logoFile);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await axios.post(CLOUDINARY_URL, formData);
      const logoUrl = res.data.secure_url;

      await updateDoc(doc(db, "registrations", registration.id), {
        logoUrl,
      });

      setLogoFile(null);
      toast({ title: "อัปเดตโลโก้สำเร็จ" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "เกิดข้อผิดพลาดในการอัปเดตโลโก้", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleMemberChange = (index: number, field: keyof Member, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleSave = async () => {
    if (!teamName || !registration) {
      toast({ title: "กรุณากรอกชื่อทีม", variant: "destructive" });
      return;
    }

    // Validate members - email and phone are optional
    const validMembers = members.filter(m => m.name && m.gameName && m.studentId && m.department && m.grade);

    // Validate phone and email format if provided
    for (const member of validMembers) {
      if (member.phone && !/^[0-9]{10}$/.test(member.phone.replace(/[^0-9]/g, ""))) {
        toast({ title: "เบอร์โทรศัพท์ไม่ถูกต้อง", variant: "destructive" });
        return;
      }
      if (member.email && !member.email.includes("@")) {
        toast({ title: "รูปแบบอีเมลไม่ถูกต้อง", variant: "destructive" });
        return;
      }
    }
    if (validMembers.length === 0) {
      toast({ title: "กรุณากรอกข้อมูลสมาชิกอย่างน้อย 1 คน", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, "registrations", registration.id), {
        teamName,
        gameMode,
        members: validMembers,
      });

      toast({ title: "บันทึกข้อมูลสำเร็จ" });
      setLocation("/my-teams");
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!registration) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => setLocation("/my-teams")}
        className="mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        กลับไปยังทีมของฉัน
      </Button>

      <div className="space-y-8">
        {/* Logo Section */}
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              โลโก้ทีม
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-40 h-40 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                <AvatarCustom
                  src={logoPreview}
                  name={teamName || "Team"}
                  size="lg"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="absolute bottom-0 right-0 bg-primary p-3 rounded-full hover:bg-primary/80 transition-all shadow-lg disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoChange(e.target.files?.[0] || null)}
                disabled={saving}
                className="hidden"
              />
            </div>
            {logoFile && (
              <Button
                onClick={handleUploadLogo}
                disabled={saving}
                className="bg-primary"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                อัปเดตโลโก้
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Team Info Section */}
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>ข้อมูลทีม</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>ชื่อทีม <span className="text-red-500">*</span></Label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="ชื่อทีมของคุณ"
                className="bg-background/50 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>เกม</Label>
              <Input
                value={registration.game}
                disabled
                className="bg-background/50 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>โหมดเกม</Label>
              <Input
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
                placeholder="เช่น 5v5, BR, etc."
                className="bg-background/50 border-white/10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Members Section */}
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>สมาชิกทีม</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {members.map((member, index) => (
              <div key={index} className="p-4 border border-white/10 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">ชื่อจริง <span className="text-red-500">*</span></Label>
                    <Input
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      placeholder="ชื่อจริง"
                      className="bg-background/50 border-white/10 h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">ชื่อในเกม <span className="text-red-500">*</span></Label>
                    <Input
                      value={member.gameName}
                      onChange={(e) => handleMemberChange(index, 'gameName', e.target.value)}
                      placeholder="IGN"
                      className="bg-background/50 border-white/10 h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">รหัสประจำตัวนักเรียน <span className="text-red-500">*</span></Label>
                    <Input
                      value={member.studentId}
                      onChange={(e) => handleMemberChange(index, 'studentId', e.target.value)}
                      placeholder="เช่น 6501234567"
                      className="bg-background/50 border-white/10 h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">เบอร์โทรศัพท์</Label>
                    <Input
                      value={member.phone}
                      onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                      placeholder="0xxxxxxxxx"
                      className="bg-background/50 border-white/10 h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">อีเมล</Label>
                    <Input
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                      placeholder="email@example.com"
                      className="bg-background/50 border-white/10 h-9"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">แผนกวิชา <span className="text-red-500">*</span></Label>
                    <Input
                      value={member.department}
                      onChange={(e) => handleMemberChange(index, 'department', e.target.value)}
                      placeholder="เช่น คอมพิวเตอร์ธุรกิจ"
                      className="bg-background/50 border-white/10 h-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">ชั้นปี <span className="text-red-500">*</span></Label>
                  <Input
                    value={member.grade}
                    onChange={(e) => handleMemberChange(index, 'grade', e.target.value)}
                    placeholder="เช่น ปวช.1"
                    className="bg-background/50 border-white/10 h-9"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => setLocation("/my-teams")}
            variant="outline"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            ยกเลิก
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-primary"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            บันทึกข้อมูล
          </Button>
        </div>
      </div>
    </div>
  );
}
