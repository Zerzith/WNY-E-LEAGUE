
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
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy, where, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamEvent, setSelectedTeamEvent] = useState<string>("all");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedRegistrationEvent, setSelectedRegistrationEvent] = useState<string>("all");
  const [matches, setMatches] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  // News state
  const [newsTitle, setNewNewsTitle] = useState("");
  const [newsContent, setNewNewsContent] = useState("");

  // Form states for new event
  const [newTitle, setNewTitle] = useState("");
  const [newGame, setNewGame] = useState("Valorant");
  const [newMaxTeams, setNewMaxTeams] = useState("16");
  const [newMembers, setNewMembers] = useState("5");
  const [newSubs, setNewSubs] = useState("1");
  const [newDate, setNewDate] = useState("");
  const [newRegDeadline, setNewRegDeadline] = useState("");
  const [newBannerUrl, setNewBannerUrl] = useState("");

  const gameBanners: { [key: string]: string } = {
    "RoV": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663358539715/NASojnuaGInFLzYF.png",
    "Free Fire": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663358539715/rUDJhrjRVtqbAmGZ.png",
    "Valorant": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663358539715/PBMkCQUSRSaFncUQ.png",
  };

  // Match Management State
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [newMatchRound, setNewMatchRound] = useState("1");
  const [newMatchGroup, setNewMatchGroup] = useState("A");
  const [newMatchTeamA, setNewMatchTeamA] = useState("");
  const [newMatchTeamB, setNewMatchTeamB] = useState("");
  const [approvedTeams, setApprovedTeams] = useState<any[]>([]);



  // Live Stream Dialog State
  const [isLiveStreamDialogOpen, setIsLiveStreamDialogOpen] = useState(false);
  const [liveStreamEventId, setLiveStreamEventId] = useState<string>("");
  const [liveStreamUrl, setLiveStreamUrl] = useState<string>("");

  const filteredRegistrations = selectedRegistrationEvent === "all"
    ? registrations
    : registrations.filter(reg => reg.eventId === selectedRegistrationEvent);

  const filteredTeams = selectedTeamEvent === "all"
    ? teams
    : teams.filter(team => team.eventId === selectedTeamEvent);

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
    const unsubRegs = onSnapshot(qRegs, async (snap) => {
      const regsWithUserDetails = await Promise.all(
        snap.docs.map(async (d) => {
          const regData = { id: d.id, ...d.data() } as any;
          if (regData.userId) {
            const userDoc = await getDoc(doc(db, "users", regData.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              regData.applicantDisplayName = userData.displayName || "N/A";
              regData.applicantEmail = userData.email || "N/A";
              regData.members = regData.members;
            }
          }
          return regData;
        })
      );
      setRegistrations(regsWithUserDetails);
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
    if (!confirm("ยืนยันการลบคำขอสมัคร?")) return;
    try {
      await deleteDoc(doc(db, "registrations", id));
      toast({ title: "ลบคำขอสมัครเรียบร้อย" });
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
        createdAt: serverTimestamp()
      });
      toast({ title: "ประกาศข่าวเรียบร้อย" });
      setNewNewsTitle("");
      setNewNewsContent("");
    } catch (error) {
      toast({ title: "ผิดพลาดในการประกาศข่าว", variant: "destructive" });
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      await deleteDoc(doc(db, "news", id));
      toast({ title: "ลบข่าวเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบข่าว", variant: "destructive" });
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchTeamA || !newMatchTeamB || newMatchTeamA === newMatchTeamB) {
      toast({ title: "กรุณาเลือกทีมที่แตกต่างกัน", variant: "destructive" });
      return;
    }

    const event = events.find(e => e.id === selectedEventId);
    const isRoV = event?.game?.toLowerCase().includes("rov");

    try {
      const matchData: any = {
        eventId: selectedEventId,
        round: parseInt(newMatchRound),
        group: newMatchGroup,
        teamA: newMatchTeamA,
        teamB: newMatchTeamB,
        scoreA: 0,
        scoreB: 0,
        status: "pending",
        createdAt: serverTimestamp()
      };

      if (isRoV) {
        matchData.winsA = 0;
        matchData.lossesA = 0;
        matchData.drawsA = 0;
        matchData.winsB = 0;
        matchData.lossesB = 0;
        matchData.drawsB = 0;
      }

      await addDoc(collection(db, "matches"), matchData);
      toast({ title: "สร้างแมตช์เรียบร้อย" });
      setNewMatchTeamA("");
      setNewMatchTeamB("");
    } catch (error) {
      toast({ title: "ผิดพลาดในการสร้างแมตช์", variant: "destructive" });
    }
  };

  const handleUpdateScore = async (id: string, team: 'A' | 'B', score: number) => {
    try {
      await updateDoc(doc(db, "matches", id), {
        [`score${team}`]: score
      });
    } catch (error) {
      toast({ title: "ผิดพลาดในการอัปเดตคะแนน", variant: "destructive" });
    }
  };

  const handleUpdateRoVScore = async (matchId: string, team: 'A' | 'B', type: string, value: string) => {
    try {
      const matchRef = doc(db, "matches", matchId);
      const matchSnap = await getDoc(matchRef);
      if (!matchSnap.exists()) return;

      const otherTeam = team === 'A' ? 'B' : 'A';

      if (value === 'win') {
        await updateDoc(matchRef, {
          [`wins${team}`]: 1, [`draws${team}`]: 0, [`losses${team}`]: 0,
          [`wins${otherTeam}`]: 0, [`draws${otherTeam}`]: 0, [`losses${otherTeam}`]: 1
        });
      } else if (value === 'draw') {
        await updateDoc(matchRef, {
          [`wins${team}`]: 0, [`draws${team}`]: 1, [`losses${team}`]: 0,
          [`wins${otherTeam}`]: 0, [`draws${otherTeam}`]: 1, [`losses${otherTeam}`]: 0
        });
      } else if (value === 'loss') {
        await updateDoc(matchRef, {
          [`wins${team}`]: 0, [`draws${team}`]: 0, [`losses${team}`]: 1,
          [`wins${otherTeam}`]: 1, [`draws${otherTeam}`]: 0, [`losses${otherTeam}`]: 0
        });
      }
    } catch (error) {
      toast({ title: "ผิดพลาดในการอัปเดตสกอร์ RoV", variant: "destructive" });
    }
  };

  const handleUpdateMatchStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "matches", id), { status });
      toast({ title: "อัปเดตสถานะแมตช์เรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการอัปเดตสถานะ", variant: "destructive" });
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("ยืนยันการลบแมตช์?")) return;
    try {
      await deleteDoc(doc(db, "matches", id));
      toast({ title: "ลบแมตช์เรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบแมตช์", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ShieldAlert className="text-primary w-8 h-8" />
              แผงควบคุมผู้ดูแลระบบ
            </h1>
            <p className="text-muted-foreground">จัดการการแข่งขัน ทีม และข่าวสาร</p>
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="bg-card/50 border border-white/10 w-full justify-start overflow-x-auto h-auto p-1 mb-8">
            <TabsTrigger value="events" className="py-2.5 px-4"><Trophy className="mr-2 h-4 w-4" />การแข่งขัน</TabsTrigger>
            <TabsTrigger value="registrations" className="py-2.5 px-4"><UserCheck className="mr-2 h-4 w-4" />คำขอสมัคร</TabsTrigger>
            <TabsTrigger value="matches" className="py-2.5 px-4"><Swords className="mr-2 h-4 w-4" />จัดการแมตช์</TabsTrigger>
            <TabsTrigger value="news" className="py-2.5 px-4"><Megaphone className="mr-2 h-4 w-4" />ข่าวสาร</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-card/50 border-white/10 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl">สร้างการแข่งขันใหม่</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">หัวข้อการแข่งขัน</Label>
                      <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="เช่น WNY VALORANT SEASON 1" required />
                    </div>
                    <div>
                      <Label htmlFor="game">เกม</Label>
                      <Select value={newGame} onValueChange={(val) => {
                        setNewGame(val);
                        setNewBannerUrl(gameBanners[val] || "");
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกเกม" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Valorant">Valorant</SelectItem>
                          <SelectItem value="RoV">RoV</SelectItem>
                          <SelectItem value="Free Fire">Free Fire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="maxTeams">จำนวนทีมสูงสุด</Label>
                      <Input id="maxTeams" type="number" value={newMaxTeams} onChange={(e) => setNewMaxTeams(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="members">สมาชิกหลักต่อทีม</Label>
                      <Input id="members" type="number" value={newMembers} onChange={(e) => setNewMembers(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="subs">ตัวสำรองสูงสุด</Label>
                      <Input id="subs" type="number" value={newSubs} onChange={(e) => setNewSubs(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">วันที่แข่งขัน</Label>
                      <Input id="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} placeholder="เช่น 25 มีนาคม 2567" required />
                    </div>
                    <div>
                      <Label htmlFor="deadline">ปิดรับสมัคร</Label>
                      <Input id="deadline" value={newRegDeadline} onChange={(e) => setNewRegDeadline(e.target.value)} placeholder="เช่น 20 มีนาคม 2567" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="banner">URL รูปภาพแบนเนอร์</Label>
                    <Input id="banner" value={newBannerUrl} onChange={(e) => setNewBannerUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <Button type="submit" className="w-full"><Plus className="mr-2 h-4 w-4" />สร้างการแข่งขัน</Button>
                </form>

                <h3 className="text-lg font-semibold mt-8 mb-4">การแข่งขันที่มีอยู่</h3>
                <div className="space-y-4">
                  {events.map((event) => (
                    <Card key={event.id} className="bg-card/70 border-white/10">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.game} | <Calendar className="inline-block h-4 w-4 mr-1" /> {event.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setLiveStreamEventId(event.id);
                            setLiveStreamUrl(event.liveStreamUrl || "");
                            setIsLiveStreamDialogOpen(true);
                          }}><MonitorPlay className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(event.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-card/50 border-white/10 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl">จัดการข่าวสาร</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateNews} className="space-y-4">
                  <div>
                    <Label htmlFor="newsTitle">หัวข้อข่าว</Label>
                    <Input id="newsTitle" value={newsTitle} onChange={(e) => setNewNewsTitle(e.target.value)} placeholder="หัวข้อข่าว" required />
                  </div>
                  <div>
                    <Label htmlFor="newsContent">เนื้อหา</Label>
                    <Input id="newsContent" value={newsContent} onChange={(e) => setNewNewsContent(e.target.value)} placeholder="เนื้อหาข่าว" required />
                  </div>
                  <Button type="submit" className="w-full"><Megaphone className="mr-2 h-4 w-4" />ประกาศข่าว</Button>
                </form>

                <h3 className="text-lg font-semibold mt-8 mb-4">ข่าวที่มีอยู่</h3>
                <div className="space-y-4">
                  {news.map((item) => (
                    <Card key={item.id} className="bg-card/70 border-white/10">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.content}</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteNews(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registrations" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-card/50 border-white/10 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">คำขอสมัครเข้าร่วม</CardTitle>
                <Select value={selectedRegistrationEvent} onValueChange={setSelectedRegistrationEvent}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="เลือกการแข่งขัน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRegistrations.length === 0 ? (
                    <p className="text-muted-foreground">ไม่มีคำขอสมัคร</p>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <Card key={reg.id} className="bg-card/70 border-white/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3">
                            {reg.logoUrl && <AvatarCustom src={reg.logoUrl} alt={reg.teamName} className="w-10 h-10" />}
                            {reg.teamName}
                          </CardTitle>
                          <CardDescription>สมัครสำหรับ: {events.find(e => e.id === reg.eventId)?.title || 'N/A'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p><strong>ผู้สมัคร:</strong> {reg.applicantDisplayName} ({reg.applicantEmail})</p>
                          <p><strong>สมาชิก:</strong></p>
                          <div className="mt-4 space-y-2">
                            {reg.members && reg.members.map((member, index) => (
                              <div key={index} className="text-xs p-2 rounded-md bg-background">
                                <p><strong>ชื่อจริง:</strong> {member.name}</p>
                                <p><strong>ชื่อในเกม:</strong> {member.gameName}</p>
                                <p><strong>รหัสนักเรียน:</strong> {member.studentId}</p>
                                <p><strong>แผนก:</strong> {member.department}</p>
                                <p><strong>ปี:</strong> {member.grade}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            {reg.status === 'pending' ? (
                              <>
                                <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleApproveRegistration(reg)}><UserCheck className="h-4 w-4 mr-2" />อนุมัติ</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRejectRegistration(reg.id)}><UserX className="h-4 w-4 mr-2" />ปฏิเสธ</Button>
                              </>
                            ) : (
                              <Badge variant={reg.status === 'approved' ? 'success' : 'destructive'}>{reg.status}</Badge>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteRegistration(reg.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-card/50 border-white/10 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">จัดการแมตช์</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMatch} className="space-y-4">
                  <div>
                    <Label htmlFor="selectedEventId">เลือกการแข่งขัน</Label>
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกการแข่งขัน" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map(event => (
                          <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newMatchRound">รอบ</Label>
                      <Input id="newMatchRound" type="number" value={newMatchRound} onChange={(e) => setNewMatchRound(e.target.value)} placeholder="เช่น 1" required />
                    </div>
                    <div>
                      <Label htmlFor="newMatchGroup">กลุ่ม</Label>
                      <Input id="newMatchGroup" value={newMatchGroup} onChange={(e) => setNewMatchGroup(e.target.value)} placeholder="เช่น A" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newMatchTeamA">ทีม A</Label>
                      <Select value={newMatchTeamA} onValueChange={setNewMatchTeamA}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกทีม A" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedTeams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              <div className="flex items-center gap-2">
                                {team.logoUrl && <AvatarCustom src={team.logoUrl} alt={team.name} className="w-6 h-6" />}
                                {team.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="newMatchTeamB">ทีม B</Label>
                      <Select value={newMatchTeamB} onValueChange={setNewMatchTeamB}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกทีม B" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedTeams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              <div className="flex items-center gap-2">
                                {team.logoUrl && <AvatarCustom src={team.logoUrl} alt={team.name} className="w-6 h-6" />}
                                {team.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full"><Swords className="mr-2 h-4 w-4" />สร้างแมตช์</Button>
                </form>

                <h3 className="text-lg font-semibold mt-8 mb-4">แมตช์ที่มีอยู่</h3>
                <div className="space-y-4">
                  {matches.map((match) => {
                    const teamA = teams.find(t => t.id === match.teamA);
                    const teamB = teams.find(t => t.id === match.teamB);
                    return (
                      <Card key={match.id} className="bg-card/70 border-white/10">
                        <CardContent className="p-4">
                          <p className="font-semibold">รอบ {match.round} | กลุ่ม {match.group}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              {teamA?.logoUrl && <AvatarCustom src={teamA.logoUrl} alt={teamA.name} className="w-6 h-6" />}
                              <span>{teamA?.name || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={match.scoreA}
                                onChange={(e) => handleUpdateScore(match.id, 'A', parseInt(e.target.value))}
                                className="w-16 text-center text-xs"
                                placeholder="0"
                              />
                              <span className="text-xs text-muted-foreground">pts</span>
                            </div>
                            <span className="mx-2">-</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">pts</span>
                              <Input
                                type="number"
                                value={match.scoreB}
                                onChange={(e) => handleUpdateScore(match.id, 'B', parseInt(e.target.value))}
                                className="w-16 text-center text-xs"
                                placeholder="0"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{teamB?.name || "N/A"}</span>
                              {teamB?.logoUrl && <AvatarCustom src={teamB.logoUrl} alt={teamB.name} className="w-6 h-6" />}
                            </div>
                          </div>
                          {(match.winsA !== undefined || match.winsB !== undefined) && (
                            <div className="mt-4 space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                {/* Team A Result */}
                                <div>
                                  <Label className="text-xs font-semibold mb-2 block">ผลลัพธ์ {teamA?.name || 'ทีม A'}</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant={match.winsA === 1 && match.drawsA === 0 && match.lossesA === 0 ? "default" : "outline"}
                                      onClick={() => handleUpdateRoVScore(match.id, 'A', 'result', 'win')}
                                      className="flex-1"
                                    >
                                      ชนะ
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={match.drawsA === 1 && match.winsA === 0 && match.lossesA === 0 ? "default" : "outline"}
                                      onClick={() => handleUpdateRoVScore(match.id, 'A', 'result', 'draw')}
                                      className="flex-1"
                                    >
                                      เสมอ
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={match.lossesA === 1 && match.winsA === 0 && match.drawsA === 0 ? "default" : "outline"}
                                      onClick={() => handleUpdateRoVScore(match.id, 'A', 'result', 'loss')}
                                      className="flex-1"
                                    >
                                      แพ้
                                    </Button>
                                  </div>
                                </div>

                                {/* Team B Result */}
                                <div>
                                  <Label className="text-xs font-semibold mb-2 block">ผลลัพธ์ {teamB?.name || 'ทีม B'}</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant={match.winsB === 1 && match.drawsB === 0 && match.lossesB === 0 ? "default" : "outline"}
                                      onClick={() => handleUpdateRoVScore(match.id, 'B', 'result', 'win')}
                                      className="flex-1"
                                    >
                                      ชนะ
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={match.drawsB === 1 && match.winsB === 0 && match.lossesB === 0 ? "default" : "outline"}
                                      onClick={() => handleUpdateRoVScore(match.id, 'B', 'result', 'draw')}
                                      className="flex-1"
                                    >
                                      เสมอ
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={match.lossesB === 1 && match.winsB === 0 && match.drawsB === 0 ? "default" : "outline"}
                                      onClick={() => handleUpdateRoVScore(match.id, 'B', 'result', 'loss')}
                                      className="flex-1"
                                    >
                                      แพ้
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between items-center mt-4">
                            <Badge variant={match.status === "ongoing" ? "default" : match.status === "completed" ? "success" : "secondary"}>
                              {match.status === "pending" && "ยังไม่เริ่ม"}
                              {match.status === "ongoing" && "กำลังดำเนินการ"}
                              {match.status === "completed" && "จบการแข่งขันแล้ว"}
                            </Badge>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleUpdateMatchStatus(match.id, "pending")} disabled={match.status === "pending"}>
                                <Calendar className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateMatchStatus(match.id, "ongoing")} disabled={match.status === "ongoing"}>
                                <MonitorPlay className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateMatchStatus(match.id, "completed")} disabled={match.status === "completed"}>
                                <Trophy className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteMatch(match.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <Dialog open={isLiveStreamDialogOpen} onOpenChange={setIsLiveStreamDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>อัปเดต Live Stream URL</DialogTitle>
              <DialogDescription>
                กรุณาใส่ URL ของ Live Stream สำหรับการแข่งขันนี้
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateLiveStream} className="space-y-4">
              <div>
                <Label htmlFor="liveStreamUrl">Live Stream URL</Label>
                <Input id="liveStreamUrl" type="url" value={liveStreamUrl} onChange={(e) => setLiveStreamUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=example" required />
              </div>
              <DialogFooter>
                <Button type="submit">บันทึก</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
