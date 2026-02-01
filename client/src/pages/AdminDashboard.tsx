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
import { Loader2, Plus, Trash2, Calendar, Users, Trophy, Edit2, Check, X, Swords, Megaphone, ShieldAlert, UserCheck, UserX } from "lucide-react";
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
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-card/50 border border-white/5 p-1 rounded-xl">
          <TabsTrigger value="events" className="data-[state=active]:bg-primary rounded-lg">การแข่งขัน</TabsTrigger>
          <TabsTrigger value="registrations" className="data-[state=active]:bg-primary rounded-lg">คำขอสมัคร</TabsTrigger>
          <TabsTrigger value="matches" className="data-[state=active]:bg-primary rounded-lg">สายแข่ง & คะแนน</TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-primary rounded-lg">ทีมทั้งหมด</TabsTrigger>
          <TabsTrigger value="news" className="data-[state=active]:bg-primary rounded-lg">ข่าวสาร</TabsTrigger>
        </TabsList>

        {/* Registrations Tab */}
        <TabsContent value="registrations">
          <div className="grid gap-6">
            {registrations.filter(r => r.status === "pending").length === 0 ? (
              <Card className="bg-card/30 border-dashed border-white/10 py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">ไม่มีคำขอสมัครใหม่ในขณะนี้</p>
              </Card>
            ) : (
              registrations.filter(r => r.status === "pending").map((reg) => (
                <Card key={reg.id} className="bg-card/50 border-white/10 overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex gap-4">
                        <AvatarCustom src={reg.logoUrl} name={reg.teamName} size="lg" />
                        <div>
                          <h3 className="text-xl font-bold text-white">{reg.teamName}</h3>
                          <p className="text-primary text-sm font-bold uppercase">{reg.game} ({reg.gameMode})</p>
                          <p className="text-xs text-muted-foreground mt-1">สมัครเมื่อ: {reg.createdAt?.toDate().toLocaleString('th-TH')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 items-start">
                        <Button onClick={() => handleApproveRegistration(reg)} className="bg-emerald-600 hover:bg-emerald-700">
                          <UserCheck className="w-4 h-4 mr-2" /> อนุมัติ
                        </Button>
                        <Button onClick={() => handleRejectRegistration(reg.id)} variant="destructive">
                          <UserX className="w-4 h-4 mr-2" /> ปฏิเสธ
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">รายชื่อสมาชิก ({reg.members?.length || 0})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {reg.members?.map((m: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded bg-white/5 border border-white/5">
                            <AvatarCustom name={m.name} size="xs" />
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium text-white truncate">{m.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{m.gameName} | {m.department}</p>
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

        {/* Teams Tab */}
        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="bg-card/50 border-white/10">
                <CardHeader className="flex flex-row items-center gap-4">
                  <AvatarCustom src={team.logoUrl} name={team.name} size="md" />
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription>{team.game}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {team.members?.map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-white/5">
                        <div className="flex items-center gap-2">
                          <AvatarCustom name={m.name} size="xs" />
                          <span className="text-white">{m.name}</span>
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

        {/* Other tabs content (Events, Matches, News) - Simplified for brevity */}
        <TabsContent value="events">
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
        </TabsContent>
        
        <TabsContent value="matches">
          <p className="text-center py-12 text-muted-foreground">ส่วนจัดการสายแข่งและคะแนน (กำลังปรับปรุง UI สมาชิก)</p>
        </TabsContent>

        <TabsContent value="news">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
