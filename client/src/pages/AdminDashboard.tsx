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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { 
  Loader2, Plus, Trash2, Calendar, Users, Trophy, 
  Edit2, Check, X, Swords, Megaphone, ShieldAlert, 
  UserCheck, UserX, Eye, EyeOff, LayoutGrid, Video, MoreVertical
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
  const [editingBannerId, setEditingBannerId] = useState<string>("");

  // Edit Match State
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // News state
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      const timer = setTimeout(() => {
        if (!user || user.role !== "admin") setLocation("/");
      }, 2000);
      return () => clearTimeout(timer);
    }

    setLoading(true);
    const unsubEvents = onSnapshot(query(collection(db, "events"), orderBy("createdAt", "desc")), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubTeams = onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "desc")), (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubRegs = onSnapshot(query(collection(db, "registrations"), orderBy("createdAt", "desc")), (snap) => {
      setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubMatches = onSnapshot(query(collection(db, "matches"), orderBy("round", "asc")), (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubNews = onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc")), (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubBanners = onSnapshot(query(collection(db, "banners"), orderBy("createdAt", "desc")), (snap) => {
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubEvents(); unsubTeams(); unsubRegs(); unsubMatches(); unsubNews(); unsubBanners();
    };
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    if (!selectedEventId) { setApprovedTeams([]); return; }
    const unsub = onSnapshot(query(collection(db, "teams"), where("eventId", "==", selectedEventId), where("status", "==", "approved")), (snap) => {
      setApprovedTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedEventId]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "events"), {
        title: newTitle, game: newGame, maxTeams: parseInt(newMaxTeams),
        membersPerTeam: parseInt(newMembers), maxSubstitutes: parseInt(newSubs),
        date: newDate, registrationDeadline: newRegDeadline, bannerUrl: newBannerUrl,
        status: "upcoming", createdAt: serverTimestamp()
      });
      toast({ title: "สร้างการแข่งขันสำเร็จ" });
      setNewTitle(""); setNewDate(""); setNewRegDeadline(""); setNewBannerUrl("");
    } catch (error) { toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" }); }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("ยืนยันการลบการแข่งขันนี้?")) return;
    try { await deleteDoc(doc(db, "events", id)); toast({ title: "ลบการแข่งขันเรียบร้อย" }); }
    catch (error) { toast({ title: "ผิดพลาดในการลบ", variant: "destructive" }); }
  };

  const handleApproveRegistration = async (reg: any) => {
    try {
      await addDoc(collection(db, "teams"), {
        name: reg.teamName, game: reg.game, logoUrl: reg.logoUrl || "",
        members: reg.members, eventId: reg.eventId, userId: reg.userId,
        status: "approved", createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "registrations", reg.id), { status: "approved" });
      toast({ title: "อนุมัติทีมเรียบร้อย" });
    } catch (error) { toast({ title: "ผิดพลาด", variant: "destructive" }); }
  };

  const handleRejectRegistration = async (id: string) => {
    if (!confirm("ยืนยันการปฏิเสธการสมัคร?")) return;
    try {
      await updateDoc(doc(db, "registrations", id), { status: "rejected" });
      toast({ title: "ปฏิเสธการสมัครเรียบร้อย" });
    } catch (error) { toast({ title: "ผิดพลาด", variant: "destructive" }); }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (!confirm("ยืนยันการลบคำขอสมัคร?")) return;
    try { await deleteDoc(doc(db, "registrations", id)); toast({ title: "ลบคำขอสมัครเรียบร้อย" }); }
    catch (error) { toast({ title: "ผิดพลาด", variant: "destructive" }); }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !newMatchTeamA || !newMatchTeamB) return;
    try {
      await addDoc(collection(db, "matches"), {
        tournamentId: selectedEventId, round: parseInt(newMatchRound),
        group: newMatchGroup, teamA: newMatchTeamA, teamB: newMatchTeamB,
        scoreA: 0, scoreB: 0, status: "pending", createdAt: serverTimestamp()
      });
      toast({ title: "สร้างแมตช์สำเร็จ" });
      setNewMatchTeamA(""); setNewMatchTeamB("");
    } catch (error) { toast({ title: "ผิดพลาด", variant: "destructive" }); }
  };

  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    try {
      await updateDoc(doc(db, "matches", editingMatch.id), {
        ...editingMatch, updatedAt: serverTimestamp()
      });
      toast({ title: "อัปเดตแมตช์สำเร็จ" });
      setIsEditDialogOpen(false);
    } catch (error) { toast({ title: "ผิดพลาด", variant: "destructive" }); }
  };

  const handleUpdateScore = async (matchId: string, scoreA: number, scoreB: number, status: string) => {
    try {
      await updateDoc(doc(db, "matches", matchId), {
        scoreA, scoreB, status, updatedAt: serverTimestamp()
      });
    } catch (error) { toast({ title: "ผิดพลาด", variant: "destructive" }); }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("ยืนยันการลบแมตช์นี้?")) return;
    try { await deleteDoc(doc(db, "matches", id)); toast({ title: "ลบแมตช์เรียบร้อย" }); }
    catch (error) { toast({ title: "ผิดพลาด", variant: "destructive" }); }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerEventId || !bannerUrl) return;
    try {
      if (editingBannerId) {
        await updateDoc(doc(db, "banners", editingBannerId), { eventId: bannerEventId, imageUrl: bannerUrl });
        toast({ title: "อัปเดตแบนเนอร์สำเร็จ" });
      } else {
        await addDoc(collection(db, "banners"), { eventId: bannerEventId, imageUrl: bannerUrl, createdAt: serverTimestamp() });
        toast({ title: "เพิ่มแบนเนอร์สำเร็จ" });
      }
      setBannerEventId(""); setBannerUrl(""); setEditingBannerId("");
    } catch (error) { toast({ title: "ผิดพลาด", variant: "destructive" }); }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("ยืนยันการลบแบนเนอร์?")) return;
    try { await deleteDoc(doc(db, "banners", id)); toast({ title: "ลบแบนเนอร์สำเร็จ" }); }
    catch (error) { toast({ title: "ผิดพลาดในการลบ", variant: "destructive" }); }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("ยืนยันการลบทีมนี้?")) return;
    try { await deleteDoc(doc(db, "teams", id)); toast({ title: "ลบทีมเรียบร้อย" }); }
    catch (error) { toast({ title: "ผิดพลาดในการลบ", variant: "destructive" }); }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "news"), {
        title: newsTitle, content: newsContent, author: user?.email || "Admin", createdAt: serverTimestamp()
      });
      toast({ title: "ประกาศข่าวสารสำเร็จ" });
      setNewsTitle(""); setNewsContent("");
    } catch (error) { toast({ title: "ผิดพลาด", variant: "destructive" }); }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("ยืนยันการลบข่าวสาร?")) return;
    try { await deleteDoc(doc(db, "news", id)); toast({ title: "ลบข่าวสารเรียบร้อย" }); }
    catch (error) { toast({ title: "ผิดพลาด", variant: "destructive" }); }
  };

  const togglePrivateData = (id: string) => {
    setShowPrivateData(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (authLoading || loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

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
            <TabsTrigger value="events">การแข่งขัน</TabsTrigger>
            <TabsTrigger value="registrations">คำขอสมัคร</TabsTrigger>
            <TabsTrigger value="matches">สายแข่ง & คะแนน</TabsTrigger>
            <TabsTrigger value="teams">ทีมทั้งหมด</TabsTrigger>
            <TabsTrigger value="banners">แบนเนอร์</TabsTrigger>
            <TabsTrigger value="news">ข่าวสาร</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="events" className="space-y-8">
          <Card className="bg-card/50 border-white/10">
            <CardHeader><CardTitle>สร้างการแข่งขันใหม่</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>ชื่อการแข่งขัน</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="ชื่อการแข่งขัน" className="bg-white/5" /></div>
                <div className="space-y-2">
                  <Label>เกม</Label>
                  <Select value={newGame} onValueChange={setNewGame}>
                    <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Valorant">Valorant</SelectItem><SelectItem value="RoV">RoV</SelectItem><SelectItem value="Free Fire">Free Fire</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>จำนวนทีมสูงสุด</Label><Input type="number" value={newMaxTeams} onChange={e => setNewMaxTeams(e.target.value)} className="bg-white/5" /></div>
                <div className="space-y-2"><Label>สมาชิกต่อทีม</Label><Input type="number" value={newMembers} onChange={e => setNewMembers(e.target.value)} className="bg-white/5" /></div>
                <div className="space-y-2"><Label>ตัวสำรองสูงสุด</Label><Input type="number" value={newSubs} onChange={e => setNewSubs(e.target.value)} className="bg-white/5" /></div>
                <div className="space-y-2"><Label>วันที่แข่งขัน</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-white/5" /></div>
                <div className="space-y-2"><Label>วันสิ้นสุดการสมัคร</Label><Input type="date" value={newRegDeadline} onChange={e => setNewRegDeadline(e.target.value)} className="bg-white/5" /></div>
                <div className="space-y-2 md:col-span-2"><Label>URL แบนเนอร์</Label><Input value={newBannerUrl} onChange={e => setNewBannerUrl(e.target.value)} placeholder="https://..." className="bg-white/5" /></div>
                <Button type="submit" className="md:col-span-3 bg-primary">สร้างการแข่งขัน</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.map((event) => {
              const pendingCount = registrations.filter(r => r.eventId === event.id && r.status === "pending").length;
              return (
                <Card key={event.id} className="bg-card/50 border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        {pendingCount > 0 && <Badge variant="destructive" className="animate-pulse">{pendingCount} คำขอ</Badge>}
                      </div>
                      <CardDescription>{event.game} | {event.status}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEvent(event.id)}><Trash2 className="w-4 h-4" /></Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /> แข่ง: {event.date}</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4 text-destructive" /> ปิดรับ: {event.registrationDeadline}</div>
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
              <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>การแข่งขัน</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="bg-white/5"><SelectValue placeholder="เลือกการแข่งขัน" /></SelectTrigger>
                    <SelectContent>{events.map(event => (<SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>รอบที่</Label><Input type="number" value={newMatchRound} onChange={e => setNewMatchRound(e.target.value)} className="bg-white/5" /></div>
                <div className="space-y-2"><Label>กลุ่ม</Label><Input value={newMatchGroup} onChange={e => setNewMatchGroup(e.target.value)} placeholder="A, B, C..." className="bg-white/5" /></div>
                <div className="space-y-2">
                  <Label>ทีม A</Label>
                  <Select value={newMatchTeamA} onValueChange={setNewMatchTeamA} disabled={!selectedEventId}>
                    <SelectTrigger className="bg-white/5"><SelectValue placeholder="เลือกทีม A" /></SelectTrigger>
                    <SelectContent>{approvedTeams.map(team => (<SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ทีม B</Label>
                  <Select value={newMatchTeamB} onValueChange={setNewMatchTeamB} disabled={!selectedEventId}>
                    <SelectTrigger className="bg-white/5"><SelectValue placeholder="เลือกทีม B" /></SelectTrigger>
                    <SelectContent>{approvedTeams.map(team => (<SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end md:col-span-2"><Button type="submit" className="w-full bg-primary"><Plus className="w-4 h-4 mr-2" /> สร้างแมตช์</Button></div>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matches.map((match) => (
              <Card key={match.id} className="bg-card/50 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Badge variant="outline">Round {match.round} | Group {match.group || 'A'}</Badge>
                    <div className="flex items-center gap-2">
                      <Dialog open={isEditDialogOpen && editingMatch?.id === match.id} onOpenChange={(open) => { if(!open) setIsEditDialogOpen(false); else { setEditingMatch(match); setIsEditDialogOpen(true); } }}>
                        <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DialogTrigger>
                        <DialogContent className="bg-card border-white/10">
                          <DialogHeader><DialogTitle>จัดการแมตช์</DialogTitle></DialogHeader>
                          <form onSubmit={handleUpdateMatch} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2"><Label>คะแนนทีม A</Label><Input type="number" value={editingMatch?.scoreA} onChange={e => setEditingMatch({...editingMatch, scoreA: parseInt(e.target.value)})} /></div>
                              <div className="space-y-2"><Label>คะแนนทีม B</Label><Input type="number" value={editingMatch?.scoreB} onChange={e => setEditingMatch({...editingMatch, scoreB: parseInt(e.target.value)})} /></div>
                            </div>
                            <div className="space-y-2">
                              <Label>สถานะ</Label>
                              <Select value={editingMatch?.status} onValueChange={val => setEditingMatch({...editingMatch, status: val})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="pending">รอดำเนินการ</SelectItem><SelectItem value="ongoing">กำลังแข่ง</SelectItem><SelectItem value="completed">จบแล้ว</SelectItem></SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2"><Label>ลิงก์ไลฟ์สด (YouTube/Facebook)</Label><Input value={editingMatch?.liveUrl || ""} onChange={e => setEditingMatch({...editingMatch, liveUrl: e.target.value})} placeholder="https://..." /></div>
                            <DialogFooter><Button type="submit">บันทึกการเปลี่ยนแปลง</Button></DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteMatch(match.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 text-center space-y-2">
                      <p className="font-bold text-white truncate">{censorText(match.teamA)}</p>
                      <div className="text-3xl font-black text-white">{match.scoreA}</div>
                    </div>
                    <div className="text-2xl font-black text-primary">VS</div>
                    <div className="flex-1 text-center space-y-2">
                      <p className="font-bold text-white truncate">{censorText(match.teamB)}</p>
                      <div className="text-3xl font-black text-white">{match.scoreB}</div>
                    </div>
                  </div>
                  {match.liveUrl && <div className="mt-4 flex items-center justify-center gap-2 text-xs text-red-500 animate-pulse"><Video className="w-3 h-3" /> กำลังถ่ายทอดสด</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="bg-card/50 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <AvatarCustom src={team.logoUrl} name={team.name} size="md" />
                    <div><CardTitle className="text-lg">{censorText(team.name)}</CardTitle><CardDescription>{team.game}</CardDescription></div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTeam(team.id)}><Trash2 className="w-4 h-4" /></Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {team.members?.map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-white/5">
                        <div className="flex items-center gap-2"><AvatarCustom name={m.name} size="xs" /> <span className="text-white">{censorText(m.gameName)}</span></div>
                        <span className="text-muted-foreground text-xs">{m.department}</span>
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
            <CardHeader><CardTitle>จัดการแบนเนอร์</CardTitle><CardDescription>เพิ่มหรือลบแบนเนอร์สำหรับแต่ละการแข่งขัน</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBanner} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>การแข่งขัน</Label>
                  <Select value={bannerEventId} onValueChange={setBannerEventId}>
                    <SelectTrigger className="bg-white/5"><SelectValue placeholder="เลือกการแข่งขัน" /></SelectTrigger>
                    <SelectContent>{events.map(event => (<SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>URL รูปภาพ</Label><Input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..." className="bg-white/5" /></div>
                <div className="flex items-end"><Button type="submit" className="w-full bg-primary"><Plus className="w-4 h-4 mr-2" /> {editingBannerId ? 'อัปเดต' : 'เพิ่ม'}แบนเนอร์</Button></div>
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
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingBannerId(banner.id); setBannerEventId(banner.eventId); setBannerUrl(banner.imageUrl); }}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteBanner(banner.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent><img src={banner.imageUrl} alt="Banner" className="w-full h-40 object-cover rounded-md" /></CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="news">
          <div className="grid gap-8">
            <Card className="bg-card/50 border-white/10">
              <CardHeader><CardTitle>ประกาศข่าวสาร</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateNews} className="space-y-4">
                  <Input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="หัวข้อข่าว" className="bg-white/5" />
                  <textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white" rows={4} placeholder="เนื้อหาข่าว..." />
                  <Button type="submit" className="w-full bg-primary">โพสต์ข่าว</Button>
                </form>
              </CardContent>
            </Card>
            <div className="grid gap-4">
              {news.map((item) => (
                <Card key={item.id} className="bg-card/50 border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle className="text-lg">{item.title}</CardTitle><CardDescription>โดย {item.author} | {item.createdAt?.toDate().toLocaleString('th-TH')}</CardDescription></div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteNews(item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
