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
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
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
    catch (error) { toast({ title: "ผิดพลาด", variant: "destructive" }); }
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
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full bg-card/50 border border-white/10 p-1 h-auto">
          <TabsTrigger value="events">การแข่งขัน</TabsTrigger>
          <TabsTrigger value="registrations">สมัครสมาชิก</TabsTrigger>
          <TabsTrigger value="bracket">สายแข่ง & คะแนน</TabsTrigger>
          <TabsTrigger value="teams">ทีมทั้งหมด</TabsTrigger>
          <TabsTrigger value="banners">แบนเนอร์</TabsTrigger>
          <TabsTrigger value="news">ข่าวสาร</TabsTrigger>
        </TabsList>

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
                <div className="space-y-2"><Label>วันที่แข่งขัน</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-white/5" /></div>
                <div className="space-y-2"><Label>วันสิ้นสุดการสมัคร</Label><Input type="date" value={newRegDeadline} onChange={e => setNewRegDeadline(e.target.value)} className="bg-white/5" /></div>
                <div className="space-y-2 md:col-span-2 lg:col-span-3"><Label>URL แบนเนอร์</Label><Input value={newBannerUrl} onChange={e => setNewBannerUrl(e.target.value)} placeholder="https://..." className="bg-white/5" /></div>
                <Button type="submit" className="md:col-span-2 lg:col-span-3 bg-primary">สร้างการแข่งขัน</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.map((event) => {
              const pendingCount = registrations.filter(r => r.eventId === event.id && r.status === "pending").length;
              return (
                <Card key={event.id} className="bg-card/50 border-white/10 overflow-hidden">
                  {event.bannerUrl && <img src={event.bannerUrl} className="w-full h-32 object-cover opacity-50" alt="" />}
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <CardDescription>{event.game} | แข่ง: {event.date || 'ไม่ระบุ'} | ปิดรับสมัคร: {event.registrationDeadline || 'ไม่ระบุ'}</CardDescription>
                      {pendingCount > 0 && <Badge variant="destructive" className="mt-2">รออนุมัติ {pendingCount} ทีม</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEvent(event.id)}><Trash2 className="w-4 h-4" /></Button>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="registrations" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {registrations.filter(r => r.status === "pending").map((reg) => (
              <Card key={reg.id} className="bg-card/50 border-white/10">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <AvatarCustom src={reg.logoUrl} name={reg.teamName} size="lg" isTeam={true} />
                    <div>
                      <h3 className="text-xl font-bold text-white">{reg.teamName}</h3>
                      <p className="text-muted-foreground">{reg.game} | {events.find(e => e.id === reg.eventId)?.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApproveRegistration(reg)} className="bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-2" /> อนุมัติ</Button>
                    <Button onClick={() => handleRejectRegistration(reg.id)} variant="destructive"><X className="w-4 h-4 mr-2" /> ปฏิเสธ</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bracket" className="space-y-8">
          <Card className="bg-card/50 border-white/10">
            <CardHeader><CardTitle>จัดการแมตช์การแข่งขัน</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>เลือกการแข่งขัน</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="bg-white/5"><SelectValue placeholder="เลือกการแข่งขัน" /></SelectTrigger>
                    <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>รอบที่</Label><Input type="number" value={newMatchRound} onChange={e => setNewMatchRound(e.target.value)} className="bg-white/5" /></div>
                <div className="space-y-2"><Label>กลุ่ม</Label><Input value={newMatchGroup} onChange={e => setNewMatchGroup(e.target.value)} className="bg-white/5" /></div>
                <div className="space-y-2">
                  <Label>ทีม A</Label>
                  <Select value={newMatchTeamA} onValueChange={setNewMatchTeamA}>
                    <SelectTrigger className="bg-white/5"><SelectValue placeholder="เลือกทีม A" /></SelectTrigger>
                    <SelectContent>{approvedTeams.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ทีม B</Label>
                  <Select value={newMatchTeamB} onValueChange={setNewMatchTeamB}>
                    <SelectTrigger className="bg-white/5"><SelectValue placeholder="เลือกทีม B" /></SelectTrigger>
                    <SelectContent>{approvedTeams.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end"><Button type="submit" className="w-full bg-primary"><Plus className="w-4 h-4 mr-2" /> สร้างแมตช์</Button></div>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matches.filter(m => !selectedEventId || m.tournamentId === selectedEventId).map((match) => (
              <Card key={match.id} className="bg-card/50 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline">Round {match.round} | Group {match.group}</Badge>
                    <Dialog open={isEditDialogOpen && editingMatch?.id === match.id} onOpenChange={(open) => { if(!open) setEditingMatch(null); setIsEditDialogOpen(open); }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setEditingMatch(match)}><MoreVertical className="w-4 h-4" /></Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-white/10">
                        <DialogHeader><DialogTitle>จัดการแมตช์</DialogTitle></DialogHeader>
                        <form onSubmit={handleUpdateMatch} className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>คะแนน {match.teamA}</Label><Input type="number" value={editingMatch?.scoreA} onChange={e => setEditingMatch({...editingMatch, scoreA: parseInt(e.target.value)})} /></div>
                            <div className="space-y-2"><Label>คะแนน {match.teamB}</Label><Input type="number" value={editingMatch?.scoreB} onChange={e => setEditingMatch({...editingMatch, scoreB: parseInt(e.target.value)})} /></div>
                          </div>
                          <div className="space-y-2">
                            <Label>สถานะ</Label>
                            <Select value={editingMatch?.status} onValueChange={v => setEditingMatch({...editingMatch, status: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="pending">รอดำเนินการ</SelectItem><SelectItem value="ongoing">กำลังแข่ง</SelectItem><SelectItem value="completed">จบแล้ว</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2"><Label>ลิงก์ไลฟ์สด (ถ้ามี)</Label><Input value={editingMatch?.liveUrl || ""} onChange={e => setEditingMatch({...editingMatch, liveUrl: e.target.value})} placeholder="https://youtube.com/..." /></div>
                          <DialogFooter className="gap-2">
                            <Button type="button" variant="destructive" onClick={() => handleDeleteMatch(match.id)}><Trash2 className="w-4 h-4 mr-2" /> ลบแมตช์</Button>
                            <Button type="submit">บันทึกการเปลี่ยนแปลง</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-center">
                    <div className="flex-1 font-bold text-white">{match.teamA}</div>
                    <div className="text-2xl font-black text-primary">{match.scoreA} : {match.scoreB}</div>
                    <div className="flex-1 font-bold text-white">{match.teamB}</div>
                  </div>
                  {match.liveUrl && <div className="mt-4 flex justify-center"><Badge className="bg-red-600"><Video className="w-3 h-3 mr-1" /> LIVE</Badge></div>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="bg-card/50 border-white/10">
                <CardHeader className="flex flex-row items-center gap-4">
                  <AvatarCustom src={team.logoUrl} name={team.name} size="md" isTeam={true} />
                  <div className="flex-1 truncate"><CardTitle className="text-lg truncate">{team.name}</CardTitle><CardDescription>{team.game}</CardDescription></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="banners" className="space-y-8">
          <Card className="bg-card/50 border-white/10">
            <CardHeader><CardTitle>จัดการแบนเนอร์</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBanner} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={bannerEventId} onValueChange={setBannerEventId}>
                  <SelectTrigger className="bg-white/5"><SelectValue placeholder="เลือกการแข่งขัน" /></SelectTrigger>
                  <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="URL รูปแบนเนอร์" className="bg-white/5" />
                <Button type="submit" className="bg-primary">{editingBannerId ? "อัปเดต" : "เพิ่ม"}แบนเนอร์</Button>
              </form>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {banners.map(b => (
              <Card key={b.id} className="bg-card/50 border-white/10 overflow-hidden">
                <img src={b.imageUrl} className="w-full h-32 object-cover" alt="" />
                <CardContent className="p-4 flex justify-between items-center">
                  <span className="text-sm truncate">{events.find(e => e.id === b.eventId)?.title}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingBannerId(b.id); setBannerEventId(b.eventId); setBannerUrl(b.imageUrl); }}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteBanner(b.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="news" className="space-y-8">
          {/* Keep existing news content but simplified if needed */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
