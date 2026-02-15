import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AvatarCustom } from "@/components/ui/avatar-custom";
import { censorText } from "@/lib/filter";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Plus, Trash2, Calendar, Users, Trophy, 
  Check, X, Swords, Megaphone, ShieldAlert, 
  UserCheck, UserX, Eye, EyeOff, LayoutGrid, MonitorPlay 
} from "lucide-react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrivateData, setShowPrivateData] = useState<Record<string, boolean>>({});

  // News state
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");

  // Form states for new event
  const [newTitle, setNewTitle] = useState("");
  const [newGame, setNewGame] = useState("Valorant");
  const [newMaxTeams, setNewMaxTeams] = useState("16");
  const [newMembers, setNewMembers] = useState("5");
  const [newSubs, setNewSubs] = useState("1");
  const [newDate, setNewDate] = useState("");
  const [newRegDeadline, setNewRegDeadline] = useState("");
  const [newBannerUrl, setNewBannerUrl] = useState("");

  // Match Management State
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [newMatchRound, setNewMatchRound] = useState("1");
  const [newMatchGroup, setNewMatchGroup] = useState("A");
  const [newMatchTeamA, setNewMatchTeamA] = useState("");
  const [newMatchTeamB, setNewMatchTeamB] = useState("");
  const [approvedTeams, setApprovedTeams] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);

  // Banner Management State
  const [bannerEventId, setBannerEventId] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");

  // Live Stream Dialog State
  const [isLiveStreamDialogOpen, setIsLiveStreamDialogOpen] = useState(false);
  const [liveStreamEventId, setLiveStreamEventId] = useState<string>("");
  const [liveStreamUrl, setLiveStreamUrl] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== "admin") {
      const timer = setTimeout(() => {
        if (!user || user.role !== "admin") {
          setLocation("/");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }

    setLoading(true);

    const qEvents = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qTeams = query(collection(db, "teams"), orderBy("createdAt", "desc"));
    const unsubTeams = onSnapshot(qTeams, (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qRegs = query(collection(db, "registrations"), orderBy("createdAt", "desc"));
    const unsubRegs = onSnapshot(qRegs, (snap) => {
      setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qMatches = query(collection(db, "matches"), orderBy("round", "asc"));
    const unsubMatches = onSnapshot(qMatches, (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qNews = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubNews = onSnapshot(qNews, (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("News fetch error:", err);
      setLoading(false);
    });

    return () => {
      unsubEvents();
      unsubTeams();
      unsubRegs();
      unsubMatches();
      unsubNews();
    };
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    const qBanners = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsubBanners = onSnapshot(qBanners, (snap) => {
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubBanners();
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setApprovedTeams([]);
      return;
    }

    const qApprovedTeams = query(
      collection(db, "teams"),
      where("eventId", "==", selectedEventId),
      where("status", "==", "approved")
    );

    const unsubApprovedTeams = onSnapshot(qApprovedTeams, (snap) => {
      setApprovedTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubApprovedTeams();
  }, [selectedEventId]);

  if (authLoading || (user && user.role === "admin" && loading)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background gap-4">
        <Loader2 className="animate-spin w-12 h-12 text-primary" />
        <p className="text-muted-foreground animate-pulse">กำลังโหลดข้อมูลแผงควบคุม...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background gap-6 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">ปฏิเสธการเข้าถึง</h1>
          <p className="text-muted-foreground max-w-md">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบเท่านั้น</p>
        </div>
        <Button onClick={() => setLocation("/")} variant="outline">กลับสู่หน้าหลัก</Button>
      </div>
    );
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "events"), {
        title: newTitle,
        game: newGame,
        maxTeams: parseInt(newMaxTeams),
        membersPerTeam: parseInt(newMembers),
        maxSubstitutes: parseInt(newSubs),
        date: newDate,
        registrationDeadline: newRegDeadline,
        bannerUrl: newBannerUrl,
        status: "upcoming",
        createdAt: serverTimestamp()
      });
      toast({ title: "สร้างการแข่งขันสำเร็จ" });
      setNewTitle("");
      setNewDate("");
      setNewRegDeadline("");
      setNewBannerUrl("");
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
  };

  const handleUpdateLiveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveStreamEventId) {
      toast({ title: "ไม่พบ Event ID", variant: "destructive" });
      return;
    }
    try {
      await updateDoc(doc(db, "events", liveStreamEventId), {
        liveStreamUrl: liveStreamUrl,
        updatedAt: serverTimestamp()
      });
      toast({ title: "อัปเดต Live Stream สำเร็จ" });
      setIsLiveStreamDialogOpen(false);
      setLiveStreamEventId("");
      setLiveStreamUrl("");
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาดในการอัปเดต Live Stream", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("ยืนยันการลบการแข่งขันนี้? ข้อมูลที่เกี่ยวข้องทั้งหมดจะหายไป")) return;
    try {
      await deleteDoc(doc(db, "events", id));
      toast({ title: "ลบการแข่งขันเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบ", variant: "destructive" });
    }
  };

  const handleApproveRegistration = async (reg: any) => {
    try {
      await addDoc(collection(db, "teams"), {
        name: reg.teamName,
        game: reg.game,
        gameMode: reg.gameMode || "",
        logoUrl: reg.logoUrl || "",
        members: reg.members,
        eventId: reg.eventId,
        userId: reg.userId,
        status: "approved",
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "registrations", reg.id), { status: "approved" });
      toast({ title: "อนุมัติทีมเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการอนุมัติ", variant: "destructive" });
    }
  };

  const handleRejectRegistration = async (id: string) => {
    if (!confirm("ยืนยันการปฏิเสธการสมัคร?")) return;
    try {
      await updateDoc(doc(db, "registrations", id), { status: "rejected" });
      toast({ title: "ปฏิเสธการสมัครเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (!confirm("ยืนยันการลบคำขอสมัครนี้ออกจากระบบ?")) return;
    try {
      await deleteDoc(doc(db, "registrations", id));
      toast({ title: "ลบคำขอสมัครเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบ", variant: "destructive" });
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !newMatchTeamA || !newMatchTeamB) {
      toast({ title: "กรุณาเลือกข้อมูลให้ครบ", variant: "destructive" });
      return;
    }
    try {
      await addDoc(collection(db, "matches"), {
        tournamentId: selectedEventId,
        round: parseInt(newMatchRound),
        group: newMatchGroup,
        teamA: newMatchTeamA,
        teamB: newMatchTeamB,
        scoreA: 0,
        scoreB: 0,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast({ title: "สร้างแมตช์สำเร็จ" });
      setNewMatchTeamA("");
      setNewMatchTeamB("");
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
  };

  const handleUpdateScore = async (matchId: string, scoreA: number, scoreB: number, status: string) => {
    try {
      await updateDoc(doc(db, "matches", matchId), {
        scoreA,
        scoreB,
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("ยืนยันการลบแมตช์นี้?")) return;
    try {
      await deleteDoc(doc(db, "matches", id));
      toast({ title: "ลบแมตช์เรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบ", variant: "destructive" });
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerEventId || !bannerUrl) return;
    try {
      await addDoc(collection(db, "banners"), {
        eventId: bannerEventId,
        imageUrl: bannerUrl,
        createdAt: serverTimestamp()
      });
      toast({ title: "เพิ่มแบนเนอร์สำเร็จ" });
      setBannerEventId("");
      setBannerUrl("");
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("ยืนยันการลบแบนเนอร์?")) return;
    try {
      await deleteDoc(doc(db, "banners", id));
      toast({ title: "ลบแบนเนอร์สำเร็จ" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบ", variant: "destructive" });
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "news"), {
        title: newsTitle,
        content: newsContent,
        author: user?.displayName || "Admin",
        createdAt: serverTimestamp()
      });
      toast({ title: "ประกาศข่าวสารสำเร็จ" });
      setNewsTitle("");
      setNewsContent("");
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("ยืนยันการลบข่าวสาร?")) return;
    try {
      await deleteDoc(doc(db, "news", id));
      toast({ title: "ลบข่าวสารเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบ", variant: "destructive" });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("ยืนยันการลบทีมนี้?")) return;
    try {
      await deleteDoc(doc(db, "teams", id));
      toast({ title: "ลบทีมเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบ", variant: "destructive" });
    }
  };

  const togglePrivateData = (id: string) => {
    setShowPrivateData(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">ADMIN DASHBOARD</h1>
          <p className="text-muted-foreground mt-1">จัดการการแข่งขันและข้อมูลระบบ</p>
        </div>
      </div>

      <Tabs defaultValue="events" className="space-y-8">
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="flex w-max min-w-full bg-card/50 border border-white/10 p-1 h-auto gap-1">
            <TabsTrigger value="events" className="px-6 py-2.5">การแข่งขัน</TabsTrigger>
            <TabsTrigger value="registrations" className="px-6 py-2.5">คำขอสมัคร</TabsTrigger>
            <TabsTrigger value="matches" className="px-6 py-2.5">สายแข่ง & คะแนน</TabsTrigger>
            <TabsTrigger value="teams" className="px-6 py-2.5">ทีมทั้งหมด</TabsTrigger>
            <TabsTrigger value="banners" className="px-6 py-2.5">แบนเนอร์</TabsTrigger>
            <TabsTrigger value="news" className="px-6 py-2.5">ข่าวสาร</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="events" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-card/50 border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> สร้างการแข่งขันใหม่
              </CardTitle>
              <CardDescription>กรอกข้อมูลเพื่อเปิดรับสมัครการแข่งขันใหม่</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ชื่อการแข่งขัน</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="เช่น RoV Tournament 2024" className="bg-white/5 border-white/10 focus:border-primary/50" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">เกม</Label>
                  <Select value={newGame} onValueChange={setNewGame}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      <SelectItem value="Valorant">Valorant</SelectItem>
                      <SelectItem value="RoV">RoV</SelectItem>
                      <SelectItem value="Free Fire">Free Fire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">จำนวนทีมสูงสุด</Label>
                  <Input type="number" value={newMaxTeams} onChange={(e) => setNewMaxTeams(e.target.value)} className="bg-white/5 border-white/10" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">สมาชิกต่อทีม</Label>
                  <Input type="number" value={newMembers} onChange={(e) => setNewMembers(e.target.value)} className="bg-white/5 border-white/10" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ตัวสำรองสูงสุด</Label>
                  <Input type="number" value={newSubs} onChange={(e) => setNewSubs(e.target.value)} className="bg-white/5 border-white/10" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">วันที่แข่งขัน</Label>
                  <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="bg-white/5 border-white/10" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">วันสิ้นสุดการสมัคร</Label>
                  <Input type="date" value={newRegDeadline} onChange={(e) => setNewRegDeadline(e.target.value)} className="bg-white/5 border-white/10" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">URL แบนเนอร์ (หน้าแรก)</Label>
                  <Input value={newBannerUrl} onChange={(e) => setNewBannerUrl(e.target.value)} placeholder="https://example.com/banner.jpg" className="bg-white/5 border-white/10" />
                </div>
                <Button type="submit" className="md:col-span-3 bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg shadow-primary/20">
                  <Trophy className="w-4 h-4 mr-2" /> สร้างการแข่งขัน
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.map((event) => {
              const pendingCount = registrations.filter(r => r.eventId === event.id && r.status === "pending").length;
              return (
                <Card key={event.id} className="bg-card/50 border-white/10 group hover:border-primary/30 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold">{event.title}</CardTitle>
                        {pendingCount > 0 && (
                          <Badge variant="destructive" className="animate-pulse bg-red-500/80">
                            {pendingCount} คำขอใหม่
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <span className="text-primary font-bold">{event.game}</span>
                        <span className="text-white/20">|</span>
                        <span>{event.status}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => {
                        setLiveStreamEventId(event.id);
                        setLiveStreamUrl(event.liveStreamUrl || "");
                        setIsLiveStreamDialogOpen(true);
                      }}>
                        <MonitorPlay className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">วันที่แข่ง</p>
                          <p className="text-sm text-white font-medium">{event.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                        <Calendar className="w-4 h-4 text-red-400" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">ปิดรับสมัคร</p>
                          <p className="text-sm text-white font-medium">{event.registrationDeadline || 'ไม่ได้กำหนด'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="registrations">
          <div className="grid gap-6">
            {registrations.length === 0 ? (
              <Card className="bg-card/30 border-dashed border-white/10 py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">ไม่มีคำขอสมัครในขณะนี้</p>
              </Card>
            ) : (
              registrations.map((reg) => (
                <Card key={reg.id} className={`bg-card/50 border-white/10 overflow-hidden ${reg.status === 'rejected' ? 'opacity-50' : ''}`}>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex gap-4">
                        <AvatarCustom src={reg.logoUrl} name={reg.teamName} size="lg" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-white">{censorText(reg.teamName)}</h3>
                            {reg.status === 'approved' && <Badge className="bg-emerald-500">อนุมัติแล้ว</Badge>}
                            {reg.status === 'rejected' && <Badge variant="destructive">ปฏิเสธแล้ว</Badge>}
                          </div>
                          <p className="text-primary text-sm font-bold uppercase">{reg.game} ({reg.gameMode || 'Normal'})</p>
                          <p className="text-xs text-muted-foreground mt-1">สมัครเมื่อ: {reg.createdAt?.toDate().toLocaleString('th-TH')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 items-start">
                        {reg.status === 'pending' && (
                          <>
                            <Button onClick={() => handleApproveRegistration(reg)} className="bg-emerald-600 hover:bg-emerald-700">
                              <UserCheck className="w-4 h-4 mr-2" /> อนุมัติ
                            </Button>
                            <Button onClick={() => handleRejectRegistration(reg.id)} variant="destructive">
                              <UserX className="w-4 h-4 mr-2" /> ปฏิเสธ
                            </Button>
                          </>
                        )}
                        <Button onClick={() => handleDeleteRegistration(reg.id)} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">รายชื่อสมาชิก ({reg.members?.length || 0})</h4>
                        <Button variant="ghost" size="sm" onClick={() => togglePrivateData(reg.id)} className="h-6 text-[10px]">
                          {showPrivateData[reg.id] ? <><EyeOff className="w-3 h-3 mr-1" /> ปิดข้อมูลลับ</> : <><Eye className="w-3 h-3 mr-1" /> ดูข้อมูลลับ</>}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {reg.members?.map((m: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded bg-white/5 border border-white/5">
                            <AvatarCustom name={m.name} size="xs" />
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium text-white truncate">{censorText(m.gameName)}</p>
                              {showPrivateData[reg.id] && (
                                <p className="text-[10px] text-muted-foreground truncate">{m.name} | {m.department}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="matches" className="space-y-8">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>สร้างแมตช์ใหม่</CardTitle>
              <CardDescription>กำหนดคู่แข่งขัน รอบ และกลุ่ม</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>การแข่งขัน</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="bg-white/5">
                      <SelectValue placeholder="เลือกการแข่งขัน" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      {events.map(event => (
                        <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>รอบที่</Label>
                  <Input type="number" value={newMatchRound} onChange={(e) => setNewMatchRound(e.target.value)} className="bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Label>กลุ่ม</Label>
                  <Input value={newMatchGroup} onChange={(e) => setNewMatchGroup(e.target.value)} placeholder="A, B, C..." className="bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Label>ทีม A</Label>
                  <Select value={newMatchTeamA} onValueChange={setNewMatchTeamA} disabled={!selectedEventId}>
                    <SelectTrigger className="bg-white/5">
                      <SelectValue placeholder="เลือกทีม A" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      {approvedTeams.map(team => (
                        <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ทีม B</Label>
                  <Select value={newMatchTeamB} onValueChange={setNewMatchTeamB} disabled={!selectedEventId}>
                    <SelectTrigger className="bg-white/5">
                      <SelectValue placeholder="เลือกทีม B" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      {approvedTeams.map(team => (
                        <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" /> สร้างแมตช์
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matches.map((match) => (
              <Card key={match.id} className="bg-card/50 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                      Round {match.round} | Group {match.group || 'A'}
                    </Badge>
                    <div className="flex gap-2">
                      <Select 
                        value={match.status} 
                        onValueChange={(val) => handleUpdateScore(match.id, match.scoreA, match.scoreB, val)}
                      >
                        <SelectTrigger className="h-8 w-32 bg-white/5 border-white/10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                          <SelectItem value="pending">รอดำเนินการ</SelectItem>
                          <SelectItem value="ongoing">กำลังแข่ง</SelectItem>
                          <SelectItem value="completed">จบแล้ว</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteMatch(match.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 text-center space-y-2">
                      <p className="font-bold text-white truncate">{censorText(match.teamA)}</p>
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 bg-white/5"
                          onClick={() => handleUpdateScore(match.id, Math.max(0, match.scoreA - 1), match.scoreB, match.status)}
                        >-</Button>
                        <span className="text-3xl font-black text-white w-12">{match.scoreA}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 bg-white/5"
                          onClick={() => handleUpdateScore(match.id, match.scoreA + 1, match.scoreB, match.status)}
                        >+</Button>
                      </div>
                    </div>
                    
                    <div className="text-2xl font-black text-primary italic">VS</div>

                    <div className="flex-1 text-center space-y-2">
                      <p className="font-bold text-white truncate">{censorText(match.teamB)}</p>
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 bg-white/5"
                          onClick={() => handleUpdateScore(match.id, match.scoreA, Math.max(0, match.scoreB - 1), match.status)}
                        >-</Button>
                        <span className="text-3xl font-black text-white w-12">{match.scoreB}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 bg-white/5"
                          onClick={() => handleUpdateScore(match.id, match.scoreA, match.scoreB + 1, match.status)}
                        >+</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="bg-card/50 border-white/10 group hover:border-primary/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                  <div className="flex items-center gap-4">
                    <AvatarCustom src={team.logoUrl} name={team.name} size="md" />
                    <div>
                      <CardTitle className="text-lg font-bold">{censorText(team.name)}</CardTitle>
                      <CardDescription className="text-primary font-bold text-xs uppercase">{team.game}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTeam(team.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">สมาชิกทีม</h4>
                    {team.members?.map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2">
                          <AvatarCustom name={m.name} size="xs" />
                          <span className="text-white font-medium">{censorText(m.gameName)}</span>
                        </div>
                        <span className="text-muted-foreground text-[10px]">{m.department}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="banners" className="space-y-8">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>จัดการแบนเนอร์</CardTitle>
              <CardDescription>เพิ่มแบนเนอร์สำหรับการแข่งขันต่างๆ</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBanner} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>การแข่งขัน</Label>
                  <Select value={bannerEventId} onValueChange={setBannerEventId}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="เลือกการแข่งขัน" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      {events.map(event => (
                        <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>URL รูปภาพ</Label>
                  <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." className="bg-white/5 border-white/10" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" /> เพิ่มแบนเนอร์
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <Card key={banner.id} className="bg-card/50 border-white/10 overflow-hidden group">
                <div className="relative aspect-video">
                  <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteBanner(banner.id)}>
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-card">
                  <p className="text-sm font-bold text-white truncate">
                    {events.find(e => e.id === banner.eventId)?.title || 'ไม่พบการแข่งขัน'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="news">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="bg-card/50 border-white/10 sticky top-8">
                <CardHeader>
                  <CardTitle>ประกาศข่าวสาร</CardTitle>
                  <CardDescription>สร้างข่าวสารใหม่เพื่อแสดงในหน้าหลัก</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateNews} className="space-y-4">
                    <div className="space-y-2">
                      <Label>หัวข้อข่าว</Label>
                      <Input value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} placeholder="ระบุหัวข้อข่าว" className="bg-white/5 border-white/10" required />
                    </div>
                    <div className="space-y-2">
                      <Label>เนื้อหา</Label>
                      <textarea value={newsContent} onChange={(e) => setNewsContent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white min-h-[200px] focus:outline-none focus:border-primary/50" placeholder="พิมพ์เนื้อหาข่าวที่นี่..." required />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                      <Megaphone className="w-4 h-4 mr-2" /> โพสต์ข่าวสาร
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2 space-y-4">
              {news.length === 0 ? (
                <Card className="bg-card/30 border-dashed border-white/10 py-12 text-center">
                  <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">ยังไม่มีประกาศข่าวสาร</p>
                </Card>
              ) : (
                news.map((item) => (
                  <Card key={item.id} className="bg-card/50 border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                        <CardDescription>
                          โดย {item.author} | {item.createdAt?.toDate().toLocaleString('th-TH')}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteNews(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Live Stream Dialog */}
        <Dialog open={isLiveStreamDialogOpen} onOpenChange={setIsLiveStreamDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>ตั้งค่า Live Stream</DialogTitle>
              <DialogDescription>เพิ่มหรือแก้ไข URL สำหรับการถ่ายทอดสด</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateLiveStream} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="livestream-url" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Stream URL</Label>
                <Input
                  id="livestream-url"
                  value={liveStreamUrl}
                  onChange={(e) => setLiveStreamUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="bg-white/5 border-white/10"
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold h-10 shadow-lg shadow-primary/20">
                  <MonitorPlay className="w-4 h-4 mr-2" /> บันทึก Live Stream
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </Tabs>
    </div>
  );
}
