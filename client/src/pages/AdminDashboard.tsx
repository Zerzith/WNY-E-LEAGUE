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
import { Loader2, Plus, Trash2, Calendar, Users, Trophy, Edit2, Check, X, Swords, Megaphone, ShieldAlert } from "lucide-react";
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

  // Match Management State
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [newMatchRound, setNewMatchRound] = useState("1");
  const [newMatchTeamA, setNewMatchTeamA] = useState("");
  const [newMatchTeamB, setNewMatchTeamB] = useState("");

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) return;

    // If no user or not admin, redirect
    if (!user || user.role !== "admin") {
      const timer = setTimeout(() => {
        if (!user || user.role !== "admin") {
          setLocation("/");
        }
      }, 2000); // Give it 2 seconds to fetch role if it's slow
      return () => clearTimeout(timer);
    }

    setLoading(true);

    const qEvents = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Events fetch error:", err));

    const qTeams = query(collection(db, "teams"), orderBy("createdAt", "desc"));
    const unsubTeams = onSnapshot(qTeams, (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Teams fetch error:", err));

    const qRegs = query(collection(db, "registrations"), orderBy("createdAt", "desc"));
    const unsubRegs = onSnapshot(qRegs, (snap) => {
      setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Regs fetch error:", err));

    const qMatches = query(collection(db, "matches"), orderBy("round", "asc"));
    const unsubMatches = onSnapshot(qMatches, (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Matches fetch error:", err));

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

  // Loading State UI
  if (authLoading || (user && user.role === "admin" && loading)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background gap-4">
        <Loader2 className="animate-spin w-12 h-12 text-primary" />
        <p className="text-muted-foreground animate-pulse">กำลังโหลดข้อมูลแผงควบคุม...</p>
      </div>
    );
  }

  // Unauthorized State UI
  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background gap-6 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">ปฏิเสธการเข้าถึง</h1>
          <p className="text-muted-foreground max-w-md">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการระบบได้
          </p>
        </div>
        <Button onClick={() => setLocation("/")} variant="outline">กลับสู่หน้าหลัก</Button>
      </div>
    );
  }

  // --- Event Handlers ---
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
        status: "upcoming",
        createdAt: serverTimestamp()
      });
      toast({ title: "สร้างการแข่งขันสำเร็จ" });
      setNewTitle("");
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("ยืนยันการลบการแข่งขัน?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
      toast({ title: "ลบการแข่งขันเรียบร้อย" });
    } catch (error) {
      toast({ title: "ลบไม่สำเร็จ", variant: "destructive" });
    }
  };

  // --- Registration Handlers ---
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
      console.error(error);
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

  // --- Match Handlers ---
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
      toast({ title: "อัปเดตคะแนนสำเร็จ" });
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("ยืนยันการลบแมตช์?")) return;
    try {
      await deleteDoc(doc(db, "matches", id));
      toast({ title: "ลบแมตช์เรียบร้อย" });
    } catch (error) {
      toast({ title: "ลบไม่สำเร็จ", variant: "destructive" });
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
    if (!confirm("ลบข่าวนี้?")) return;
    await deleteDoc(doc(db, "news", id));
    toast({ title: "ลบข่าวเรียบร้อย" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight">แผงควบคุมผู้ดูแลระบบ</h1>
        </div>
      </div>
      
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-card/50 border border-white/5 p-1 rounded-xl">
          <TabsTrigger value="events" className="data-[state=active]:bg-primary rounded-lg">การแข่งขัน</TabsTrigger>
          <TabsTrigger value="registrations" className="data-[state=active]:bg-primary rounded-lg">คำขอสมัคร</TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-primary rounded-lg">ทีมทั้งหมด</TabsTrigger>
          <TabsTrigger value="matches" className="data-[state=active]:bg-primary rounded-lg">สายแข่ง & คะแนน</TabsTrigger>
          <TabsTrigger value="news" className="data-[state=active]:bg-primary rounded-lg">ข่าวสาร</TabsTrigger>
        </TabsList>

        {/* --- Events Tab --- */}
        <TabsContent value="events" className="space-y-6">
          <Card className="bg-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> สร้างการแข่งขันใหม่</CardTitle>
              <CardDescription>กำหนดรายละเอียดและกติกาการแข่งขัน</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ชื่อรายการ</Label>
                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="เช่น Valorant College Cup" className="bg-background/50" required />
                  </div>
                  <div className="space-y-2">
                    <Label>เลือกเกม</Label>
                    <Select value={newGame} onValueChange={setNewGame}>
                      <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Valorant">Valorant</SelectItem>
                        <SelectItem value="RoV">RoV</SelectItem>
                        <SelectItem value="Free Fire">Free Fire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>วันที่แข่งขัน</Label>
                    <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-background/50" required />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>จำนวนทีมสูงสุด</Label>
                      <Input type="number" value={newMaxTeams} onChange={e => setNewMaxTeams(e.target.value)} className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>สมาชิกหลัก/ทีม</Label>
                      <Input type="number" value={newMembers} onChange={e => setNewMembers(e.target.value)} className="bg-background/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>ตัวสำรองสูงสุด/ทีม</Label>
                    <Input type="number" value={newSubs} onChange={e => setNewSubs(e.target.value)} className="bg-background/50" />
                  </div>
                  <Button type="submit" className="w-full bg-primary mt-6 h-11 font-bold">
                    <Plus className="w-4 h-4 mr-2" /> สร้างรายการแข่งขัน
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="text-primary" /> รายการทั้งหมด ({events.length})</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {events.map(event => (
                <Card key={event.id} className="bg-card/50 border-white/10 hover:border-primary/50 transition-all group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                        {event.game.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-primary transition-colors">{event.title}</h3>
                        <p className="text-xs text-muted-foreground">{event.game} • {event.date} • {event.maxTeams} ทีม</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* --- Registrations Tab --- */}
        <TabsContent value="registrations">
          <Card className="bg-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> คำขอสมัครเข้าแข่งขัน</CardTitle>
              <CardDescription>ตรวจสอบและอนุมัติทีมที่สมัครเข้ามา</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {registrations.filter(r => r.status === 'pending').length === 0 && (
                  <div className="text-center py-12 bg-background/20 rounded-xl border border-dashed border-white/5">
                    <Users className="w-12 h-12 mx-auto text-white/5 mb-2" />
                    <p className="text-muted-foreground">ไม่มีคำขอสมัครใหม่ในขณะนี้</p>
                  </div>
                )}
                {registrations.filter(r => r.status === 'pending').map(reg => (
                  <div key={reg.id} className="p-5 border border-white/5 rounded-xl bg-background/30 space-y-4 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {reg.logoUrl ? (
                          <img src={reg.logoUrl} className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center font-bold text-xl">{reg.teamName.charAt(0)}</div>
                        )}
                        <div>
                          <h3 className="font-bold text-white text-lg">{reg.teamName}</h3>
                          <p className="text-sm text-primary font-medium">{reg.game} {reg.gameMode && `(${reg.gameMode})`}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-9 px-4" onClick={() => handleApproveRegistration(reg)}>
                          <Check className="w-4 h-4 mr-1" /> อนุมัติ
                        </Button>
                        <Button size="sm" variant="destructive" className="h-9 px-4" onClick={() => handleRejectRegistration(reg.id)}>
                          <X className="w-4 h-4 mr-1" /> ปฏิเสธ
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {reg.members.map((m: any, i: number) => (
                        <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5">
                          <p className="text-white font-bold text-xs truncate">{m.name}</p>
                          <p className="text-muted-foreground text-[10px] truncate">IGN: {m.gameName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Teams Tab --- */}
        <TabsContent value="teams">
          <Card className="bg-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> ทีมที่ผ่านการอนุมัติ ({teams.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-background/30 hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center font-bold">{team.name.charAt(0)}</div>
                      )}
                      <div>
                        <h3 className="font-bold text-white text-sm">{team.name}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{team.game} • {team.members?.length} คน</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if(confirm("ลบทีมนี้?")) deleteDoc(doc(db, "teams", team.id));
                    }} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Matches Tab --- */}
        <TabsContent value="matches" className="space-y-6">
          <Card className="bg-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Swords className="w-5 h-5 text-primary" /> จัดการสายการแข่งขัน</CardTitle>
              <CardDescription>สร้างแมตช์และอัปเดตผลการแข่งขัน</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMatch} className="grid md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>รายการแข่งขัน</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="เลือกรายการ" /></SelectTrigger>
                    <SelectContent>
                      {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>รอบที่</Label>
                  <Input type="number" value={newMatchRound} onChange={e => setNewMatchRound(e.target.value)} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>ทีม A</Label>
                  <Select value={newMatchTeamA} onValueChange={setNewMatchTeamA}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="เลือกทีม A" /></SelectTrigger>
                    <SelectContent>
                      {teams.filter(t => t.eventId === selectedEventId).map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ทีม B</Label>
                  <Select value={newMatchTeamB} onValueChange={setNewMatchTeamB}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="เลือกทีม B" /></SelectTrigger>
                    <SelectContent>
                      {teams.filter(t => t.eventId === selectedEventId).map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="md:col-span-4 bg-accent hover:bg-accent/90 h-11 font-bold text-black">
                  <Swords className="w-4 h-4 mr-2" /> สร้างแมตช์การแข่งขัน
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Trophy className="text-primary" /> รายการแมตช์ทั้งหมด ({matches.length})</h2>
            <div className="grid gap-4">
              {matches.map(match => (
                <Card key={match.id} className="bg-card/50 border-white/10 hover:border-white/20 transition-all">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4 flex-1 justify-center md:justify-start">
                        <div className="text-center bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                          <p className="text-[10px] text-primary font-black uppercase">Round</p>
                          <p className="text-xl font-black text-white">{match.round}</p>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>
                        <div className="text-right min-w-[120px]">
                          <p className="font-bold text-white truncate">{match.teamA}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                          <Input 
                            type="number" 
                            className="w-12 h-8 text-center bg-transparent border-none text-xl font-black text-primary p-0" 
                            defaultValue={match.scoreA}
                            onBlur={(e) => handleUpdateScore(match.id, parseInt(e.target.value), match.scoreB, match.status)}
                          />
                          <span className="text-white/20 font-bold">:</span>
                          <Input 
                            type="number" 
                            className="w-12 h-8 text-center bg-transparent border-none text-xl font-black text-primary p-0" 
                            defaultValue={match.scoreB}
                            onBlur={(e) => handleUpdateScore(match.id, match.scoreA, parseInt(e.target.value), match.status)}
                          />
                        </div>
                        <div className="text-left min-w-[120px]">
                          <p className="font-bold text-white truncate">{match.teamB}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Select 
                          value={match.status} 
                          onValueChange={(val) => handleUpdateScore(match.id, match.scoreA, match.scoreB, val)}
                        >
                          <SelectTrigger className="w-32 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">รอแข่ง</SelectItem>
                            <SelectItem value="ongoing">กำลังแข่ง</SelectItem>
                            <SelectItem value="completed">จบแล้ว</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMatch(match.id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* --- News Tab --- */}
        <TabsContent value="news" className="space-y-6">
          <Card className="bg-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> ประกาศข่าวสารใหม่</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateNews} className="space-y-4">
                <div className="space-y-2">
                  <Label>หัวข้อข่าว</Label>
                  <Input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="เช่น ประกาศวันแข่งรอบชิง" className="bg-background/50" required />
                </div>
                <div className="space-y-2">
                  <Label>เนื้อหาข่าว</Label>
                  <textarea 
                    className="w-full h-32 bg-background/50 border border-white/10 rounded-xl p-4 text-white focus:ring-2 ring-primary/50 outline-none transition-all"
                    value={newsContent}
                    onChange={e => setNewsContent(e.target.value)}
                    placeholder="รายละเอียดข่าวสาร..."
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary h-11 font-bold">
                  <Megaphone className="w-4 h-4 mr-2" /> โพสต์ประกาศข่าวสาร
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="text-primary" /> ข่าวสารทั้งหมด ({news.length})</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {news.map(item => (
                <Card key={item.id} className="bg-card/50 border-white/10 hover:border-white/20 transition-all">
                  <CardContent className="p-5 flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-bold text-white text-lg">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.createdAt?.toDate?.().toLocaleString('th-TH')}</p>
                      <p className="text-sm text-white/60 line-clamp-2">{item.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteNews(item.id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
