import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { AvatarCustom } from "@/components/ui/avatar-custom";
import { Loader2, Upload, Plus, Trash2, ShieldCheck, Users, Gamepad2, Camera, AlertCircle } from "lucide-react";

const CLOUD_NAME = "djubsqri6";
const UPLOAD_PRESET = "wangnamyenesport";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface Member {
  name: string;
  gameName: string;
  grade: string;
  department: string;
  studentId: string;
  phone: string;
  email: string;
}

interface Tournament {
  id: string;
  title: string;
  game: string;
  date: string;
  maxTeams?: number;
  status?: string;
}

export default function RegisterTeam() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [teamName, setTeamName] = useState("");
  const [game, setGame] = useState("");
  const [gameMode, setGameMode] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const [members, setMembers] = useState<Member[]>([
    { name: "", gameName: "", grade: "", department: "", studentId: "", phone: "", email: "" }
  ]);

  const gameRules = {
    "Valorant": { min: 5, max: 6, sub: 1 },
    "RoV": { min: 5, max: 6, sub: 1 },
    "Free Fire": { min: 4, max: 5, sub: 1 }
  };

  const currentGameRules = gameRules[game as keyof typeof gameRules] || { min: 1, max: 6, sub: 0 };

  useEffect(() => {
    const q = query(collection(db, "events"), where("status", "in", ["upcoming", "ongoing"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tournamentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
      
      tournamentsData.forEach(async (tournament) => {
        const registrationsQuery = query(
          collection(db, "registrations"),
          where("eventId", "==", tournament.id),
          where("status", "==", "approved")
        );
        
        const registrationsSnapshot = await new Promise<any>((resolve) => {
          onSnapshot(registrationsQuery, resolve);
        });
        
        const teamCount = registrationsSnapshot.docs.length;
        if (tournament.maxTeams && teamCount >= tournament.maxTeams && tournament.status === "ongoing") {
          await updateDoc(doc(db, "events", tournament.id), {
            status: "closed"
          });
        }
      });
      
      setTournaments(tournamentsData);
      setIsLoadingTournaments(false);
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleAddMember = () => {
    if (members.length < currentGameRules.max) {
      setMembers([...members, { name: "", gameName: "", grade: "", department: "", studentId: "", phone: "", email: "" }]);
    }
  };

  const handleRemoveMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const handleMemberChange = (index: number, field: keyof Member, value: string) => {
    const newMembers = [...members];
    (newMembers[index] as any)[field] = value;
    setMembers(newMembers);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({ title: `ขนาดไฟล์โลโก้ต้องไม่เกิน ${MAX_FILE_SIZE_MB} MB`, variant: "destructive" });
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({ title: "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, GIF, WEBP เท่านั้น", variant: "destructive" });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateMembers = () => {
    for (const member of members) {
      if (!member.name || !member.gameName || !member.studentId || !member.phone) {
        return false;
      }
      if (member.email && !member.email.includes("@")) {
        return false;
      }
      if (!/^[0-9]{10}$/.test(member.phone.replace(/[^0-9]/g, ""))) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !game || !selectedTournament) {
      toast({ title: "กรุณากรอกข้อมูลการแข่งขันให้ครบถ้วน", variant: "destructive" });
      return;
    }

    const validMembers = members.filter(m => m.name && m.gameName && m.studentId && m.phone);
    if (validMembers.length < currentGameRules.min) {
      toast({ title: `กรุณาเพิ่มสมาชิกอย่างน้อย ${currentGameRules.min} คน พร้อมข้อมูลที่ครบถ้วน`, variant: "destructive" });
      return;
    }

    if (!validateMembers()) {
      toast({ title: "กรุณากรอกข้อมูลสมาชิกให้ครบถ้วนและถูกต้อง", variant: "destructive" });
      return;
    }

    let logoUrl = logoPreview;
    try {
      setIsUploading(true);
      
      if (logoFile) {
        try {
          const formData = new FormData();
          formData.append("file", logoFile);
          formData.append("upload_preset", UPLOAD_PRESET);
          const response = await fetch(CLOUDINARY_URL, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
          }

          const data = await response.json();
          if (data?.secure_url) {
            logoUrl = data.secure_url;
          }
        } catch (uploadError: any) {
          console.error("Logo upload error:", uploadError);
          toast({ title: "ไม่สามารถอัปโหลดโลโก้ได้ แต่จะลงทะเบียนโดยไม่มีโลโก้", variant: "default" });
          setIsUploading(false);
          return;
        }
      }

      await addDoc(collection(db, "registrations"), {
        eventId: selectedTournament,
        userId: user.uid,
        teamName,
        game,
        gameMode,
        logoUrl: logoUrl || "",
        members: validMembers,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      toast({ title: "ลงทะเบียนทีมสำเร็จ รอการตรวจสอบ" });
      setLocation("/");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({ title: error.message || "เกิดข้อผิดพลาดในการลงทะเบียน", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="text-white w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight uppercase">ลงทะเบียนทีมแข่ง</h1>
          <p className="text-muted-foreground">เข้าร่วมการแข่งขัน WNY Esports Tournament</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-primary" /> ข้อมูลการแข่งขัน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>เลือกรายการแข่งขัน <span className="text-red-500">*</span></Label>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue placeholder="เลือกรายการแข่งขัน" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.title} ({t.game})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ชื่อทีม <span className="text-red-500">*</span></Label>
                  <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="ชื่อทีมของคุณ" className="bg-background/50 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>เกมที่ลงแข่ง <span className="text-red-500">*</span></Label>
                  <Select value={game} onValueChange={setGame}>
                    <SelectTrigger className="bg-background/50 border-white/10">
                      <SelectValue placeholder="เลือกเกม" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Valorant">Valorant</SelectItem>
                      <SelectItem value="RoV">RoV</SelectItem>
                      <SelectItem value="Free Fire">Free Fire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> รายชื่อสมาชิก</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddMember} disabled={members.length >= currentGameRules.max}>
                <Plus className="w-4 h-4 mr-2" /> เพิ่มสมาชิก
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-2 text-sm text-blue-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>กรุณากรอกข้อมูลสมาชิกให้ครบถ้วน ต้องมีสมาชิกอย่างน้อย {currentGameRules.min} คน</p>
              </div>
              
              {members.map((member, index) => (
                <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-4 relative group">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">สมาชิกคนที่ {index + 1}</h4>
                    {members.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveMember(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">ชื่อ-นามสกุล <span className="text-red-500">*</span></Label>
                      <Input 
                        value={member.name} 
                        onChange={e => handleMemberChange(index, 'name', e.target.value)} 
                        placeholder="ชื่อจริง-นามสกุล" 
                        className="bg-background/50 border-white/10 h-9" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">ชื่อในเกม (IGN) <span className="text-red-500">*</span></Label>
                      <Input 
                        value={member.gameName} 
                        onChange={e => handleMemberChange(index, 'gameName', e.target.value)} 
                        placeholder="In-game Name" 
                        className="bg-background/50 border-white/10 h-9" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">รหัสประจำตัวนักเรียน <span className="text-red-500">*</span></Label>
                      <Input 
                        value={member.studentId} 
                        onChange={e => handleMemberChange(index, 'studentId', e.target.value)} 
                        placeholder="เช่น 64001" 
                        className="bg-background/50 border-white/10 h-9" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">เบอร์โทรศัพท์ <span className="text-red-500">*</span></Label>
                      <Input 
                        value={member.phone} 
                        onChange={e => handleMemberChange(index, 'phone', e.target.value)} 
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
                        onChange={e => handleMemberChange(index, 'email', e.target.value)} 
                        placeholder="email@example.com" 
                        className="bg-background/50 border-white/10 h-9" 
                        type="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">แผนกวิชา</Label>
                      <Input 
                        value={member.department} 
                        onChange={e => handleMemberChange(index, 'department', e.target.value)} 
                        placeholder="เช่น คอมพิวเตอร์ธุรกิจ" 
                        className="bg-background/50 border-white/10 h-9" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">ชั้นปี</Label>
                    <Input 
                      value={member.grade} 
                      onChange={e => handleMemberChange(index, 'grade', e.target.value)} 
                      placeholder="เช่น ปวช.1" 
                      className="bg-background/50 border-white/10 h-9" 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> โลโก้ทีม</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div className="relative group">
                <AvatarCustom 
                  src={logoPreview} 
                  name={teamName || "Team"} 
                  size="xl" 
                  className="ring-4 ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 bg-primary p-3 rounded-full hover:bg-primary/80 transition-all shadow-lg disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                ขนาดไฟล์ไม่เกิน {MAX_FILE_SIZE_MB}MB
              </p>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-12 text-base" disabled={isUploading || isLoadingTournaments}>
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            ลงทะเบียนทีม
          </Button>
        </div>
      </form>
    </div>
  );
}
