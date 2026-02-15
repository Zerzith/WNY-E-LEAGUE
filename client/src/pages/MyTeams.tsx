import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarCustom } from "@/components/ui/avatar-custom";
import { Loader2, Upload, Edit2, Check, X } from "lucide-react";
import axios from "axios";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "djubsqri6";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "wangnamyenesport";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

interface TeamRegistration {
  id: string;
  teamName: string;
  game: string;
  logoUrl: string;
  status: "pending" | "approved" | "rejected";
  eventId: string;
  eventTitle?: string;
  members: any[];
}

export default function MyTeams() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [teams, setTeams] = useState<TeamRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [uploadingTeamId, setUploadingTeamId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement>>({});

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    const q = query(
      collection(db, "registrations"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as TeamRegistration));

      // Fetch event titles
      const eventsQuery = query(collection(db, "events"));
      const eventsSnapshot = await new Promise<any>((resolve) => {
        onSnapshot(eventsQuery, resolve);
      });

      const eventMap: Record<string, string> = {};
      eventsSnapshot.docs.forEach((doc: any) => {
        eventMap[doc.id] = doc.data().title;
      });

      const enrichedTeams = teamsData.map(team => ({
        ...team,
        eventTitle: eventMap[team.eventId] || "Unknown Event",
      }));

      setTeams(enrichedTeams);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, setLocation]);

  const handleLogoChange = (teamId: string, file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "ขนาดไฟล์ต้องไม่เกิน 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(prev => ({
        ...prev,
        [teamId]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async (teamId: string, file: File | null) => {
    if (!file) return;

    try {
      setUploadingTeamId(teamId);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await axios.post(CLOUDINARY_URL, formData);
      const logoUrl = res.data.secure_url;

      await updateDoc(doc(db, "registrations", teamId), {
        logoUrl,
      });

      setEditingTeamId(null);
      setLogoPreview(prev => {
        const newPreview = { ...prev };
        delete newPreview[teamId];
        return newPreview;
      });

      toast({ title: "อัปเดตโลโก้สำเร็จ" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ 
        title: "เกิดข้อผิดพลาดในการอัปเดตโลโก้", 
        variant: "destructive" 
      });
    } finally {
      setUploadingTeamId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">กำลังโหลดทีมของคุณ...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">ทีมของฉัน</h1>
        <p className="text-muted-foreground">จัดการและแก้ไขข้อมูลทีมของคุณ</p>
      </div>

      {teams.length === 0 ? (
        <Card className="bg-card/50 border-dashed border-white/10 py-12 text-center">
          <p className="text-muted-foreground mb-4">คุณยังไม่ได้ลงทะเบียนทีมใด</p>
          <Button onClick={() => setLocation("/register-team")} className="bg-primary">
            ลงทะเบียนทีม
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <Card key={team.id} className="bg-card/50 border-white/10 overflow-hidden">
              <CardContent className="p-6">
                {/* Logo Section */}
                <div className="mb-4 relative">
                  <div className="w-full aspect-square rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                    {editingTeamId === team.id && logoPreview[team.id] ? (
                      <img 
                        src={logoPreview[team.id]} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarCustom 
                        src={team.logoUrl} 
                        name={team.teamName} 
                        size="lg"
                      />
                    )}
                  </div>

                  {/* Edit Logo Button */}
                  {editingTeamId === team.id ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        ref={(el) => {
                          if (el) fileInputRefs.current[team.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoChange(team.id, file);
                        }}
                        className="hidden"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRefs.current[team.id]?.click()}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        เลือกรูป
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary"
                        onClick={() => {
                          const file = fileInputRefs.current[team.id]?.files?.[0];
                          if (file) {
                            handleUploadLogo(team.id, file);
                          }
                        }}
                        disabled={uploadingTeamId === team.id}
                      >
                        {uploadingTeamId === team.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingTeamId(null);
                          setLogoPreview(prev => {
                            const newPreview = { ...prev };
                            delete newPreview[team.id];
                            return newPreview;
                          });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingTeamId(team.id)}
                      className="w-full mt-3"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      แก้ไขโลโก้
                    </Button>
                  )}
                </div>

                {/* Team Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">ชื่อทีม</p>
                    <p className="font-bold text-white">{team.teamName}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">เกม</p>
                    <p className="font-semibold text-white">{team.game}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">การแข่งขัน</p>
                    <p className="font-semibold text-white">{team.eventTitle}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">จำนวนสมาชิก</p>
                    <p className="font-semibold text-white">{team.members?.length || 0} คน</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">สถานะ</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        team.status === "approved" ? "bg-green-500" :
                        team.status === "rejected" ? "bg-red-500" :
                        "bg-yellow-500"
                      }`} />
                      <span className="text-sm font-semibold text-white">
                        {team.status === "approved" ? "อนุมัติแล้ว" :
                         team.status === "rejected" ? "ปฏิเสธ" :
                         "รอการตรวจสอบ"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
