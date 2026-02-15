import { useEffect, useState } from "react";
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
  Edit2, Check, X, Swords, Megaphone, ShieldAlert, 
  UserCheck, UserX, Eye, EyeOff, LayoutGrid 
} from "lucide-react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const [newRegistrationDeadline, setNewRegistrationDeadline] = useState("");
  const [newBannerUrl, setNewBannerUrl] = useState("");
  const [editingEventId, setEditingEventId] = useState<string>("");
  const [editingBannerUrl, setEditingBannerUrl] = useState<string>("");

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
      setApprovedTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qRegistrations = query(collection(db, "registrations"), orderBy("createdAt", "desc"));
    const unsubRegistrations = onSnapshot(qRegistrations, (snap) => {
      setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qMatches = query(collection(db, "matches"), orderBy("createdAt", "desc"));
    const unsubMatches = onSnapshot(qMatches, (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qNews = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubNews = onSnapshot(qNews, (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const qBanners = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsubBanners = onSnapshot(qBanners, (snap) => {
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubEvents();
      unsubTeams();
      unsubRegistrations();
      unsubMatches();
      unsubNews();
      unsubBanners();
    };
  }, [authLoading, user, setLocation]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newRegistrationDeadline) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบถ้วน", variant: "destructive" });
      return;
    }
    try {
      await addDoc(collection(db, "events"), {
        title: newTitle,
        game: newGame,
        maxTeams: parseInt(newMaxTeams),
        membersPerTeam: parseInt(newMembers),
        maxSubstitutes: parseInt(newSubs),
        date: newDate,
        registrationDeadline: newRegistrationDeadline,
        bannerUrl: newBannerUrl,
        status: "upcoming",
        createdAt: serverTimestamp()
      });
      toast({ title: "สร้างการแข่งขันสำเร็จ" });
      setNewTitle("");
      setNewDate("");
      setNewRegistrationDeadline("");
      setNewBannerUrl("");
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
  };

  const handleUpdateEventBanner = async (eventId: string, bannerUrl: string) => {
    if (!bannerUrl) {
      toast({ title: "กรุณาระบุ URL แบนเนอร์", variant: "destructive" });
      return;
    }
    try {
      await updateDoc(doc(db, "events", eventId), { bannerUrl });
      toast({ title: "อัปเดตแบนเนอร์สำเร็จ" });
      setEditingEventId("");
      setEditingBannerUrl("");
    } catch (error) {
      toast({ title: "ผิดพลาดในการอัปเดต", variant: "destructive" });
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
    if (!confirm("ยืนยันการลบการสมัครนี้?")) return;
    try {
      await deleteDoc(doc(db, "registrations", id));
      toast({ title: "ลบการสมัครเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !newMatchTeamA || !newMatchTeamB) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบถ้วน", variant: "destructive" });
      return;
    }
    try {
      await addDoc(collection(db, "matches"), {
        eventId: selectedEventId,
        teamA: newMatchTeamA,
        teamB: newMatchTeamB,
        scoreA: 0,
        scoreB: 0,
        round: parseInt(newMatchRound),
        group: newMatchGroup,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast({ title: "สร้างแมตช์สำเร็จ" });
      setNewMatchTeamA("");
      setNewMatchTeamB("");
    } catch (error) {
      toast({ title: "ผิดพลาดในการสร้างแมตช์", variant: "destructive" });
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("ยืนยันการลบแมตช์นี้?")) return;
    try {
      await deleteDoc(doc(db, "matches", id));
      toast({ title: "ลบแมตช์เรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerEventId || !bannerUrl) {
      toast({ title: "กรุณาเลือกการแข่งขันและระบุ URL แบนเนอร์", variant: "destructive" });
      return;
    }
    try {
      await addDoc(collection(db, "banners"), {
        eventId: bannerEventId,
        imageUrl: bannerUrl,
        createdAt: serverTimestamp()
      });
      toast({ title: "สร้างแบนเนอร์สำเร็จ" });
      setBannerEventId("");
      setBannerUrl("");
    } catch (error) {
      toast({ title: "ผิดพลาดในการสร้างแบนเนอร์", variant: "destructive" });
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("ยืนยันการลบแบนเนอร์นี้?")) return;
    try {
      await deleteDoc(doc(db, "banners", id));
      toast({ title: "ลบแบนเนอร์เรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบแบนเนอร์", variant: "destructive" });
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("ยืนยันการลบข่าวสารนี้?")) return;
    try {
      await deleteDoc(doc(db, "news", id));
      toast({ title: "ลบข่าวสารเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsContent) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบถ้วน", variant: "destructive" });
      return;
    }
    try {
      await addDoc(collection(db, "news"), {
        title: newsTitle,
        content: newsContent,
        author: user?.email || "Admin",
        createdAt: serverTimestamp()
      });
      toast({ title: "สร้างข่าวสารสำเร็จ" });
      setNewsTitle("");
      setNewsContent("");
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">ไม่มีสิทธิ์เข้าถึง</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-white mb-2">แดชบอร์ดแอดมิน</h1>
        <p className="text-muted-foreground">จัดการการแข่งขัน ทีม และข้อมูลอื่นๆ</p>
      </div>

      <Tabs defaultValue="events" className="space-y-8">
        <TabsList className="grid w-full grid-cols-6 bg-card/50 border border-white/10">
          <TabsTrigger value="events">การแข่งขัน</TabsTrigger>
          <TabsTrigger value="registrations">สมัครสมาชิก</TabsTrigger>
          <TabsTrigger value="bracket">สายแข่งขัน</TabsTrigger>
          <TabsTrigger value="scoreboard">คะแนน</TabsTrigger>
          <TabsTrigger value="banners">แบนเนอร์</TabsTrigger>
          <TabsTrigger value="news">ข่าวสาร</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-8">
          <div className="grid gap-8">
            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle>สร้างการแข่งขันใหม่</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ชื่อการแข่งขัน *</Label>
                    <Input 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)} 
                      placeholder="เช่น WNY ROV Tournament" 
                      className="bg-white/5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>เกม</Label>
                    <Select value={newGame} onValueChange={setNewGame}>
                      <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Valorant">Valorant</SelectItem>
                        <SelectItem value="RoV">RoV</SelectItem>
                        <SelectItem value="Free Fire">Free Fire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>จำนวนทีมสูงสุด</Label>
                    <Input 
                      value={newMaxTeams} 
                      onChange={e => setNewMaxTeams(e.target.value)} 
                      type="number" 
                      className="bg-white/5" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>จำนวนสมาชิกต่อทีม</Label>
                    <Input 
                      value={newMembers} 
                      onChange={e => setNewMembers(e.target.value)} 
                      type="number" 
                      className="bg-white/5" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>วันที่แข่งขัน *</Label>
                    <Input 
                      value={newDate} 
                      onChange={e => setNewDate(e.target.value)} 
                      type="date" 
                      className="bg-white/5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>วันสิ้นสุดการสมัคร *</Label>
                    <Input 
                      value={newRegistrationDeadline} 
                      onChange={e => setNewRegistrationDeadline(e.target.value)} 
                      type="date" 
                      className="bg-white/5"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>URL แบนเนอร์</Label>
                    <Input 
                      value={newBannerUrl} 
                      onChange={e => setNewBannerUrl(e.target.value)} 
                      placeholder="https://example.com/banner.jpg" 
                      className="bg-white/5" 
                    />
                  </div>
                  <Button type="submit" className="md:col-span-2 bg-primary"><Plus className="w-4 h-4 mr-2" /> สร้างการแข่ง</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle>การแข่งขันทั้งหมด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <Card key={event.id} className="bg-card/50 border-white/10">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {event.game} | {event.status}
                            </CardDescription>
                            {event.date && (
                              <p className="text-xs text-muted-foreground mt-2">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(event.date).toLocaleDateString('th-TH')}
                              </p>
                            )}
                            {event.registrationDeadline && (
                              <p className="text-xs text-yellow-400 mt-1">
                                ปิดรับสมัคร: {new Date(event.registrationDeadline).toLocaleDateString('th-TH')}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {editingEventId === event.id ? (
                              <>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => handleUpdateEventBanner(event.id, editingBannerUrl)}
                                  className="text-green-500 hover:bg-green-500/10"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => setEditingEventId("")}
                                  className="text-muted-foreground"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingEventId(event.id);
                                    setEditingBannerUrl(event.bannerUrl || "");
                                  }}
                                  className="text-accent hover:bg-accent/10"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="text-destructive hover:bg-destructive/10" 
                                  onClick={() => handleDeleteEvent(event.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {editingEventId === event.id && (
                        <CardContent>
                          <Input 
                            value={editingBannerUrl} 
                            onChange={e => setEditingBannerUrl(e.target.value)} 
                            placeholder="URL แบนเนอร์" 
                            className="bg-white/5"
                          />
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Registrations Tab */}
        <TabsContent value="registrations" className="space-y-8">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>การสมัครสมาชิก</CardTitle>
              <CardDescription>รอการอนุมัติ: {registrations.filter(r => r.status === "pending").length}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {registrations.filter(r => r.status === "pending").map((reg) => (
                  <Card key={reg.id} className="bg-background/50 border-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{reg.teamName}</h4>
                        <p className="text-sm text-muted-foreground">{reg.game}</p>
                        {reg.logoUrl && (
                          <img src={reg.logoUrl} alt={reg.teamName} className="w-12 h-12 rounded mt-2 object-cover" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveRegistration(reg)}
                        >
                          <Check className="w-4 h-4 mr-1" /> อนุมัติ
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectRegistration(reg.id)}
                        >
                          <X className="w-4 h-4 mr-1" /> ปฏิเสธ
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Bracket Tab */}
        <TabsContent value="bracket" className="space-y-8">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>สายการแข่งขัน</CardTitle>
              <CardDescription>ดูสายการแข่งขันแบบเรียลไทม์</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">ไปที่หน้า <a href="/bracket" className="text-primary hover:underline">สายการแข่งขัน</a> เพื่อดูและจัดการสายการแข่งขัน</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoreboard Tab */}
        <TabsContent value="scoreboard" className="space-y-8">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>ตารางคะแนน</CardTitle>
              <CardDescription>ดูตารางคะแนนของทีมทั้งหมด</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">ไปที่หน้า <a href="/scoreboard" className="text-primary hover:underline">ตารางคะแนน</a> เพื่อดูและจัดการตารางคะแนน</p>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-8">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>จัดการแบนเนอร์</CardTitle>
              <CardDescription>เพิ่มหรือลบแบนเนอร์สำหรับแต่ละการแข่งขัน</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBanner} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label>การแข่งขัน</Label>
                  <Select value={bannerEventId} onValueChange={setBannerEventId}>
                    <SelectTrigger className="bg-white/5"><SelectValue placeholder="เลือกการแข่งขัน" /></SelectTrigger>
                    <SelectContent>
                      {events.map(event => (
                        <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>URL รูปภาพ</Label>
                  <Input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://example.com/banner.jpg" className="bg-white/5" />
                </div>
                <div className="flex items-end md:col-span-1">
                  <Button type="submit" className="w-full bg-primary"><Plus className="w-4 h-4 mr-2" /> เพิ่มแบนเนอร์</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <Card key={banner.id} className="bg-card/50 border-white/10 overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{events.find(e => e.id === banner.eventId)?.title || 'ไม่พบการแข่งขัน'}</CardTitle>
                    <CardDescription className="text-xs truncate">{banner.imageUrl}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleDeleteBanner(banner.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <img src={banner.imageUrl} alt={`แบนเนอร์สำหรับ ${events.find(e => e.id === banner.eventId)?.title}`} className="w-full h-40 object-cover rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news">
          <div className="grid gap-8">
            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle>สร้างข่าวสารใหม่</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateNews} className="space-y-4">
                  <div className="space-y-2">
                    <Label>หัวข้อ</Label>
                    <Input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="หัวข้อข่าวสาร" className="bg-white/5" />
                  </div>
                  <div className="space-y-2">
                    <Label>เนื้อหา</Label>
                    <textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} placeholder="เนื้อหาข่าวสาร" className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-white" rows={5} />
                  </div>
                  <Button type="submit" className="bg-primary"><Plus className="w-4 h-4 mr-2" /> สร้างข่าวสาร</Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {news.map((item) => (
                <Card key={item.id} className="bg-card/50 border-white/10">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription className="text-xs mt-2">โดย {item.author} • {item.createdAt?.toDate?.().toLocaleDateString('th-TH')}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteNews(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
