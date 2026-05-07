import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, Plus, Trash2, ShieldCheck, Users, Gamepad2, Camera, AlertCircle, Menu, X, ImageIcon, User, GraduationCap, BookOpen, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([
    { name: "", gameName: "", grade: "", department: "", studentId: "", phone: "", email: "" },
    { name: "", gameName: "", grade: "", department: "", studentId: "", phone: "", email: "" },
    { name: "", gameName: "", grade: "", department: "", studentId: "", phone: "", email: "" }
  ]);

  const gameRules = {
    "Valorant": { min: 5, max: 6, sub: 1 },
    "RoV": { min: 5, max: 6, sub: 1 },
    "Free Fire": { min: 4, max: 5, sub: 1 }
  };

  const currentGameRules = gameRules[game as keyof typeof gameRules] || { min: 1, max: 6, sub: 0 };

  const userMenuItems = [
    { href: "/my-teams", label: "ทีมของฉัน", icon: "Users" },
    { href: "/match-management", label: "จัดการแมตช์", icon: "Swords" },
    { href: "/register-team", label: "ลงทะเบียนทีม", icon: "Edit2" },
  ];

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
      if (!member.name || !member.gameName || !member.studentId || !member.department || !member.grade) {
        return false;
      }
      if (member.phone && !/^[0-9]{10}$/.test(member.phone.replace(/[^0-9]/g, ""))) {
        return false;
      }
      if (member.email && !member.email.includes("@")) {
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

    const validMembers = members.filter(m => m.name && m.gameName && m.studentId && m.department && m.grade);
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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 text-muted-foreground hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-display tracking-tight uppercase">ลงทะเบียนทีมแข่ง</h1>
              <p className="text-muted-foreground">เข้าร่วมการแข่งขัน WNY Esports Tournament</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Card className="bg-card/50 border-white/10 backdrop-blur-sm p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded-full" />
                ข้อมูลการแข่งขัน
              </h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white/60 uppercase tracking-wider">เลือกรายการแข่งขัน <span className="text-red-500">*</span></Label>
                  <select 
                    value={selectedTournament} 
                    onChange={e => setSelectedTournament(e.target.value)}
                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-primary focus:border-primary"
                  >
                    <option value="">เลือกรายการแข่งขัน</option>
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.id}>{t.title} ({t.game})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-white/60 uppercase tracking-wider">ชื่อทีม <span className="text-red-500">*</span></Label>
                    <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="ชื่อทีมของคุณ" className="bg-background/50 border-white/10 h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-white/60 uppercase tracking-wider">เกมที่ลงแข่ง <span className="text-red-500">*</span></Label>
                    <select value={game} onChange={e => setGame(e.target.value)} className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-primary focus:border-primary h-11">
                      <option value="">เลือกเกม</option>
                      <option value="Valorant">Valorant</option>
                      <option value="RoV">RoV</option>
                      <option value="Free Fire">Free Fire</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 border-white/10 backdrop-blur-sm p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  รายชื่อสมาชิก
                </h2>
                <Button type="button" variant="outline" size="sm" onClick={handleAddMember} disabled={members.length >= currentGameRules.max}>
                  <Plus className="w-4 h-4 mr-2" /> เพิ่มสมาชิก
                </Button>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-2 text-sm text-blue-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>กรุณากรอกข้อมูลสมาชิกให้ครบถ้วน ต้องมีสมาชิกอย่างน้อย {currentGameRules.min} คน</p>
                </div>
                
                {members.map((member, index) => (
                  <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4 relative group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="absolute -left-3 top-6 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shadow-lg ring-4 ring-background">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold text-white ml-8">สมาชิกคนที่ {index + 1}</h4>
                      {members.length > 1 && index >= 3 && (
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1">
                          <User className="w-3 h-3" /> ชื่อจริง-นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          value={member.name} 
                          onChange={e => handleMemberChange(index, 'name', e.target.value)} 
                          placeholder="ชื่อจริง-นามสกุล" 
                          className="bg-background/50 border-white/10 h-11 rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1">
                          <Gamepad2 className="w-3 h-3" /> ชื่อในเกม (IGN) <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          value={member.gameName} 
                          onChange={e => handleMemberChange(index, 'gameName', e.target.value)} 
                          placeholder="In-game Name" 
                          className="bg-background/50 border-white/10 h-11 rounded-xl" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1">
                          <Fingerprint className="w-3 h-3" /> รหัสนักเรียน <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          value={member.studentId} 
                          onChange={e => handleMemberChange(index, 'studentId', e.target.value)} 
                          placeholder="เช่น 64001" 
                          className="bg-background/50 border-white/10 h-11 rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> แผนกวิชา <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          value={member.department} 
                          onChange={e => handleMemberChange(index, 'department', e.target.value)} 
                          placeholder="เช่น คอมพิวเตอร์" 
                          className="bg-background/50 border-white/10 h-11 rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> ชั้นปี <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          value={member.grade} 
                          onChange={e => handleMemberChange(index, 'grade', e.target.value)} 
                          placeholder="เช่น ปวช.1" 
                          className="bg-background/50 border-white/10 h-11 rounded-xl" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 ml-1">เบอร์โทรศัพท์</label>
                        <Input 
                          value={member.phone} 
                          onChange={e => handleMemberChange(index, 'phone', e.target.value)} 
                          placeholder="0xxxxxxxxx" 
                          className="bg-background/50 border-white/10 h-11 rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 ml-1">อีเมล</label>
                        <Input 
                          value={member.email} 
                          onChange={e => handleMemberChange(index, 'email', e.target.value)} 
                          placeholder="email@example.com" 
                          className="bg-background/50 border-white/10 h-11 rounded-xl" 
                          type="email"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="mt-6 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 rounded-xl border border-dashed border-primary/30 w-full py-6"
                  onClick={() => setMembers([...members, { name: "", gameName: "", grade: "", department: "", studentId: "", phone: "", email: "" }])}
                >
                  + เพิ่มสมาชิกสำรอง (Substitute)
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card className="bg-card/50 border-white/10 backdrop-blur-sm p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded-full" />
                โลโก้ทีม
              </h2>
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {logoPreview ? (
                  <div className="relative w-32 h-32 mb-4 group/logo">
                    <img src={logoPreview} alt="Team Logo Preview" className="w-full h-full object-cover rounded-2xl ring-4 ring-primary/20" />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setLogoPreview("")}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      {isUploading ? <Loader2 className="w-10 h-10 text-primary animate-spin" /> : <ImageIcon className="w-10 h-10 text-primary" />}
                    </div>
                    <p className="text-white font-bold">อัปโหลดโลโก้ทีม</p>
                    <p className="text-xs text-muted-foreground mt-1">แนะนำขนาด 512x512px (PNG/JPG)</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                ขนาดไฟล์ไม่เกิน {MAX_FILE_SIZE_MB}MB
              </p>
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

      {/* Sidebar for User Menu */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          className="fixed left-0 top-16 z-40 w-64 h-[calc(100vh-4rem)] bg-card/95 backdrop-blur-sm border-r border-white/10 shadow-2xl"
        >
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">เมนู</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {userMenuItems.map((item) => (
                <a key={item.href} href={item.href}>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${location === item.href 
                        ? 'bg-primary/20 text-primary border border-primary/50' 
                        : 'text-muted-foreground hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <span className="font-medium">{item.label}</span>
                  </button>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
