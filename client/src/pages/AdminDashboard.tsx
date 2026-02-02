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

  // Match Management State
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [newMatchRound, setNewMatchRound] = useState("1");
  const [newMatchGroup, setNewMatchGroup] = useState("A");
  const [newMatchTeamA, setNewMatchTeamA] = useState("");
  const [newMatchTeamB, setNewMatchTeamB] = useState("");

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
    if (!confirm("ยืนยันการลบข่าวสารนี้?")) return;
    try {
      await deleteDoc(doc(db, "news", id));
      toast({ title: "ลบข่าวสารเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบ", variant: "destructive" });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("ยืนยันการลบทีมนี้ออกจากระบบ?")) return;
    try {
      await deleteDoc(doc(db, "teams", id));
      toast({ title: "ลบทีมเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบ", variant: "destructive" });
    }
  };

  const togglePrivateData = (id: string) => {
    setShowPrivateData(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight uppercase">แผงควบคุมแอดมิน</h1>
        </div>
      </div>
      
      <Tabs defaultValue="registrations" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-card/50 border border-white/5 p-1 rounded-xl overflow-x-auto">
          <TabsTrigger value="events" className="data-[state=active]:bg-primary rounded-lg whitespace-nowrap">การแข่งขัน</TabsTrigger>
          <TabsTrigger value="registrations" className="data-[state=active]:bg-primary rounded-lg whitespace-nowrap">คำขอสมัคร</TabsTrigger>
          <TabsTrigger value="matches" className="data-[state=active]:bg-primary rounded-lg whitespace-nowrap">สายแข่ง & คะแนน</TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-primary rounded-lg whitespace-nowrap">ทีมทั้งหมด</TabsTrigger>
          <TabsTrigger value="news" className="data-[state=active]:bg-primary rounded-lg whitespace-nowrap">ข่าวสาร</TabsTrigger>
        </TabsList>

        {/* Registrations Tab */}
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
                          <p className="text-primary text-sm font-bold uppercase">{reg.game} ({reg.gameMode})</p>
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

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-8">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>สร้างแมตช์ใหม่</CardTitle>
              <CardDescription>กำหนดคู่แข่งขัน รอบ และกลุ่ม</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label>รายการแข่ง</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="bg-white/5"><SelectValue placeholder="เลือกรายการ" /></SelectTrigger>
                    <SelectContent>
                      {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ทีม A</Label>
                  <Input value={newMatchTeamA} onChange={e => setNewMatchTeamA(e.target.value)} placeholder="ชื่อทีม A" className="bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Label>ทีม B</Label>
                  <Input value={newMatchTeamB} onChange={e => setNewMatchTeamB(e.target.value)} placeholder="ชื่อทีม B" className="bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Label>รอบที่</Label>
                  <Input type="number" value={newMatchRound} onChange={e => setNewMatchRound(e.target.value)} className="bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Label>กลุ่ม</Label>
                  <Input value={newMatchGroup} onChange={e => setNewMatchGroup(e.target.value)} placeholder="A, B, C..." className="bg-white/5" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-primary"><Plus className="w-4 h-4 mr-2" /> สร้างแมตช์</Button>
                </div>
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
                      <Select 
                        value={match.status}
                        onValueChange={(val) => handleUpdateScore(match.id, match.scoreA, match.scoreB, val)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs bg-white/5"><SelectValue /></SelectTrigger>
                        <SelectContent>
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
                      <Input 
                        type="number" 
                        className="text-center text-2xl font-black bg-white/5" 
                        value={match.scoreA} 
                        onChange={(e) => handleUpdateScore(match.id, parseInt(e.target.value) || 0, match.scoreB, match.status)}
                      />
                    </div>
                    <div className="text-2xl font-black text-primary">VS</div>
                    <div className="flex-1 text-center space-y-2">
                      <p className="font-bold text-white truncate">{censorText(match.teamB)}</p>
                      <Input 
                        type="number" 
                        className="text-center text-2xl font-black bg-white/5" 
                        value={match.scoreB} 
                        onChange={(e) => handleUpdateScore(match.id, match.scoreA, parseInt(e.target.value) || 0, match.status)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="bg-card/50 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <AvatarCustom src={team.logoUrl} name={team.name} size="md" />
                    <div>
                      <CardTitle className="text-lg">{censorText(team.name)}</CardTitle>
                      <CardDescription>{team.game}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTeam(team.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {team.members?.map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-white/5">
                        <div className="flex items-center gap-2">
                          <AvatarCustom name={m.name} size="xs" />
                          <span className="text-white">{censorText(m.gameName)}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{m.department}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <div className="grid gap-8">
            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle>สร้างการแข่งขันใหม่</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ชื่อการแข่งขัน</Label>
                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="เช่น WNY ROV Tournament" className="bg-white/5" />
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
                  <Button type="submit" className="md:col-span-2 bg-primary">สร้างการแข่งขัน</Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="bg-card/50 border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <CardDescription>{event.game} | {event.status}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEvent(event.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* News Tab */}
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
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>โดย {item.author} | {item.createdAt?.toDate().toLocaleString('th-TH')}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteNews(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
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
