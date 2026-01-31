import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateTeam } from "@/hooks/use-teams";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Upload, Plus, Trash2 } from "lucide-react";
import { type InsertTeam } from "@shared/schema";
import axios from "axios";

// Cloudinary config (Client-side upload for speed, usually would be signed on server)
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset";

interface Member {
  name: string;
  gameName: string;
  grade: string;
  department: string;
}

interface Tournament {
  id: string;
  title: string;
  game: string;
  date: string;
}

export default function RegisterTeam() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createTeam = useCreateTeam();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [teamName, setTeamName] = useState("");
  const [game, setGame] = useState("");
  const [gameMode, setGameMode] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const [members, setMembers] = useState<Member[]>([
    { name: "", gameName: "", grade: "", department: "" }
  ]);

  const gameRules = {
    "Valorant": { min: 5, max: 6, sub: 1 },
    "RoV": { min: 5, max: 6, sub: 1 },
    "Free Fire": { min: 4, max: 5, sub: 1 }
  };

  const currentGameRules = gameRules[game as keyof typeof gameRules] || { min: 1, max: 6, sub: 0 };

  // Load tournaments from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "events"),
      where("status", "in", ["upcoming", "ongoing"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tournamentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        game: doc.data().game,
        date: doc.data().date,
      } as Tournament));
      setTournaments(tournamentsData);
      setIsLoadingTournaments(false);
    });

    return () => unsubscribe();
  }, []);

  // Redirect if not logged in
  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleAddMember = () => {
    if (members.length < currentGameRules.max) {
      setMembers([...members, { name: "", gameName: "", grade: "", department: "" }]);
    }
  };

  const handleRemoveMember = (index: number) => {
    if (members.length > 1) {
      const newMembers = [...members];
      newMembers.splice(index, 1);
      setMembers(newMembers);
    }
  };

  const handleMemberChange = (index: number, field: keyof Member, value: string) => {
    const newMembers = [...members];
    (newMembers[index] as any)[field] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !game || !selectedTournament || (game === "Free Fire" && !gameMode)) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบถ้วน", variant: "destructive" });
      return;
    }

    if (members.length < currentGameRules.min) {
      toast({ title: `ต้องการสมาชิกอย่างน้อย ${currentGameRules.min} คน`, variant: "destructive" });
      return;
    }

    let logoUrl = "";

    try {
      if (logoFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("upload_preset", UPLOAD_PRESET);

        const res = await axios.post(CLOUDINARY_URL, formData);
        logoUrl = res.data.secure_url;
      }

      // Add registration to Firestore instead of creating a team
      await addDoc(collection(db, "registrations"), {
        eventId: selectedTournament,
        userId: user.uid,
        teamName: teamName,
        game: game,
        gameMode: gameMode,
        logoUrl: logoUrl,
        members: members,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      toast({ title: "ลงทะเบียนทีมสำเร็จ รอการตรวจสอบ", variant: "default" });
      setLocation("/");

    } catch (error) {
      console.error(error);
      toast({ title: "อัปโหลดรูปล้มเหลว หรือ การลงทะเบียนผิดพลาด", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Card className="bg-card border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-display text-white">ลงทะเบียนทีมแข่ง</CardTitle>
          <CardDescription>เลือกรายการแข่งขัน และกรอกข้อมูลทีมและสมาชิก</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Tournament Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-primary">เลือกรายการแข่งขัน</h3>
              {isLoadingTournaments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground">กำลังโหลดรายการแข่งขัน...</span>
                </div>
              ) : tournaments.length === 0 ? (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300">
                  ยังไม่มีรายการแข่งขันที่เปิดรับสมัคร
                </div>
              ) : (
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="เลือกรายการแข่งขัน" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        {tournament.title} - {tournament.game} ({tournament.date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Team Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-primary">ข้อมูลทีม</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">ชื่อทีม</Label>
                  <Input 
                    id="teamName" 
                    placeholder="ใส่ชื่อทีมเท่ๆ..." 
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="bg-background/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>เกมที่ลงแข่ง</Label>
                  <Select onValueChange={(val) => { setGame(val); setGameMode(""); }} value={game}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="เลือกเกม" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Valorant">Valorant</SelectItem>
                      <SelectItem value="RoV">RoV Mobile</SelectItem>
                      <SelectItem value="Free Fire">Free Fire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {game === "Free Fire" && (
                <div className="space-y-2">
                  <Label>โหมดการเล่น</Label>
                  <Select onValueChange={setGameMode} value={gameMode}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="เลือกโหมด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CS-MODE">4v4 (CS-MODE)</SelectItem>
                      <SelectItem value="BR-MODE">BATTLE ROYALE (BR-MODE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>โลโก้ทีม</Label>
                <div className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center bg-background/20 hover:bg-background/40 transition-colors cursor-pointer text-muted-foreground hover:text-white">
                  <input 
                    type="file" 
                    className="hidden" 
                    id="logo-upload"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                  <Label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full h-full">
                    {logoFile ? (
                      <div className="text-center">
                        <span className="text-accent">{logoFile.name}</span>
                        <p className="text-xs mt-1">คลิกเพื่อเปลี่ยนรูปภาพ</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8" />
                        <span>คลิกเพื่ออัปโหลดโลโก้</span>
                      </>
                    )}
                  </Label>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-primary">รายชื่อสมาชิก</h3>
                  <p className="text-xs text-muted-foreground">
                    ต้องการ {currentGameRules.min} คน (รวมสำรองได้สูงสุด {currentGameRules.max} คน)
                  </p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddMember}
                  disabled={members.length >= currentGameRules.max}
                >
                  <Plus className="w-4 h-4 mr-2" /> เพิ่มสมาชิก
                </Button>
              </div>

              {members.map((member, index) => (
                <div key={index} className="p-4 rounded-lg bg-background/30 border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-muted-foreground">
                      สมาชิกคนที่ {index + 1} 
                      {index === 0 ? " (หัวหน้าทีม)" : (index >= currentGameRules.min ? " (ตัวสำรอง)" : "")}
                    </span>
                    {index > 0 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveMember(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ชื่อ-นามสกุล</Label>
                      <Input 
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                        placeholder="นายสมชาย ใจดี"
                        className="bg-background/50 h-9"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ชื่อในเกม (IGN)</Label>
                      <Input 
                        value={member.gameName}
                        onChange={(e) => handleMemberChange(index, "gameName", e.target.value)}
                        placeholder="Somchai007"
                        className="bg-background/50 h-9"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ระดับชั้น</Label>
                      <Input 
                        value={member.grade}
                        onChange={(e) => handleMemberChange(index, "grade", e.target.value)}
                        placeholder="ปวช. 3/1"
                        className="bg-background/50 h-9"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>แผนกวิชา</Label>
                      <Input 
                        value={member.department}
                        onChange={(e) => handleMemberChange(index, "department", e.target.value)}
                        placeholder="เทคโนโลยีสารสนเทศ"
                        className="bg-background/50 h-9"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              disabled={isUploading || createTeam.isPending || !selectedTournament}
            >
              {(isUploading || createTeam.isPending) && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              ยืนยันการลงทะเบียน
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
