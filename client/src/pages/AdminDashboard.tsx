
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
    if (!confirm("ยืนยันการลบการสมัครนี้?")) return;
    try {
      await deleteDoc(doc(db, "registrations", id));
      toast({ title: "ลบการสมัครเรียบร้อย" });
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
        createdAt: serverTimestamp()
      });
      toast({ title: "สร้างข่าวสำเร็จ" });
      setNewNewsTitle("");
      setNewNewsContent("");
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("ยืนยันการลบข่าวนี้?")) return;
    try {
      await deleteDoc(doc(db, "news", id));
      toast({ title: "ลบข่าวเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการลบ", variant: "destructive" });
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !newMatchTeamA || !newMatchTeamB) {
      toast({ title: "กรุณาเลือกการแข่งขันและทีมให้ครบถ้วน", variant: "destructive" });
      return;
    }
    if (newMatchTeamA === newMatchTeamB) {
      toast({ title: "ทีม A และ ทีม B ต้องไม่ซ้ำกัน", variant: "destructive" });
      return;
    }
    try {
      const eventData = events.find(e => e.id === selectedEventId);
      const isRoV = eventData?.game?.toLowerCase().includes('rov') || eventData?.game?.toLowerCase().includes('realm');
      
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
        matchData.winsB = 0;
        matchData.lossesA = 0;
        matchData.lossesB = 0;
        matchData.drawsA = 0;
        matchData.drawsB = 0;
      }
      
      await addDoc(collection(db, "matches"), matchData);
      toast({ title: "สร้างแมตช์สำเร็จ" });
      setNewMatchRound("1");
      setNewMatchGroup("A");
      setNewMatchTeamA("");
      setNewMatchTeamB("");
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
  };

  const handleUpdateScore = async (matchId: string, team: 'A' | 'B', score: number) => {
    try {
      const field = team === 'A' ? 'scoreA' : 'scoreB';
      await updateDoc(doc(db, "matches", matchId), { [field]: score });
      toast({ title: "อัปเดตคะแนนสำเร็จ" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการอัปเดตคะแนน", variant: "destructive" });
    }
  };
  
  const handleUpdateRoVScore = async (matchId: string, team: 'A' | 'B', type: 'wins' | 'losses' | 'draws', value: number) => {
    try {
      const field = team === 'A' ? `${type}A` : `${type}B`;
      await updateDoc(doc(db, "matches", matchId), { [field]: value });
      toast({ title: "อัปเดตคะแนน RoV สำเร็จ" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการอัปเดตคะแนน RoV", variant: "destructive" });
    }
  };

  const handleUpdateMatchStatus = async (matchId: string, status: string) => {
    try {
      const statusMap: { [key: string]: string } = {
        "pending": "pending",
        "ongoing": "ongoing",
        "completed": "completed"
      };
      await updateDoc(doc(db, "matches", matchId), { status: statusMap[status] || status });
      const statusText = status === "pending" ? "ยังไม่เริ่ม" : status === "ongoing" ? "กำลังดำเนินการ" : "จบการแข่งขัน";
      toast({ title: `เปลี่ยนสถานะเป็น ${statusText}` });
    } catch (error) {
      toast({ title: "ผิดพลาดในการอัปเดตสถานะ", variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-primary">แผงควบคุมผู้ดูแลระบบ</h1>

        <Tabs defaultValue="events" className="space-y-8">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="flex w-max min-w-full bg-card/50 border border-white/10 p-1 h-auto gap-1">
              <TabsTrigger value="events" className="px-6 py-2.5">การแข่งขัน</TabsTrigger>
              <TabsTrigger value="news" className="px-6 py-2.5">ข่าวสาร</TabsTrigger>
              <TabsTrigger value="registrations" className="px-6 py-2.5">คำขอสมัคร</TabsTrigger>
              <TabsTrigger value="matches" className="px-6 py-2.5">สายแข่ง & คะแนน</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="events" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-card/50 border-white/10 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">จัดการการแข่งขัน</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newTitle">ชื่อการแข่งขัน</Label>
                      <Input id="newTitle" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="เช่น Valorant Champions Tour" required />
                    </div>
                    <div>
                      <Label htmlFor="newGame">เกม</Label>
                      <Select value={newGame} onValueChange={setNewGame}>
                        <SelectTrigger className="w-full">
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="newMaxTeams">จำนวนทีมสูงสุด</Label>
                      <Input id="newMaxTeams" type="number" value={newMaxTeams} onChange={(e) => setNewMaxTeams(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="newMembers">ผู้เล่นต่อทีม</Label>
                      <Input id="newMembers" type="number" value={newMembers} onChange={(e) => setNewMembers(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="newSubs">ตัวสำรองสูงสุด</Label>
                      <Input id="newSubs" type="number" value={newSubs} onChange={(e) => setNewSubs(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="newDate">วันที่แข่งขัน</Label>
                      <Input id="newDate" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newRegDeadline">วันปิดรับสมัคร</Label>
                    <Input id="newRegDeadline" type="date" value={newRegDeadline} onChange={(e) => setNewRegDeadline(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="newBannerUrl">URL แบนเนอร์</Label>
                    <Input id="newBannerUrl" value={newBannerUrl} onChange={(e) => setNewBannerUrl(e.target.value)} placeholder="ใส่ URL รูปภาพแบนเนอร์" />
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
                            <Input
                              type="number"
                              value={match.scoreA}
                              onChange={(e) => handleUpdateScore(match.id, 'A', parseInt(e.target.value))}
                              className="w-20 text-center"
                            />
                            <span className="mx-2">-</span>
                            <Input
                              type="number"
                              value={match.scoreB}
                              onChange={(e) => handleUpdateScore(match.id, 'B', parseInt(e.target.value))}
                              className="w-20 text-center"
                            />
                            <div className="flex items-center gap-2">
                              <span>{teamB?.name || "N/A"}</span>
                              {teamB?.logoUrl && <AvatarCustom src={teamB.logoUrl} alt={teamB.name} className="w-6 h-6" />}
                            </div>
                          </div>
                          {(match.winsA !== undefined || match.winsB !== undefined) && (
                            <div className="mt-3 grid grid-cols-6 gap-2 text-xs">
                              <div>
                                <Label className="text-xs">ชนะ A</Label>
                                <Input type="number" value={match.winsA || 0} onChange={(e) => handleUpdateRoVScore(match.id, 'A', 'wins', parseInt(e.target.value))} className="h-8" />
                              </div>
                              <div>
                                <Label className="text-xs">เสมอ A</Label>
                                <Input type="number" value={match.drawsA || 0} onChange={(e) => handleUpdateRoVScore(match.id, 'A', 'draws', parseInt(e.target.value))} className="h-8" />
                              </div>
                              <div>
                                <Label className="text-xs">แพ้ A</Label>
                                <Input type="number" value={match.lossesA || 0} onChange={(e) => handleUpdateRoVScore(match.id, 'A', 'losses', parseInt(e.target.value))} className="h-8" />
                              </div>
                              <div>
                                <Label className="text-xs">ชนะ B</Label>
                                <Input type="number" value={match.winsB || 0} onChange={(e) => handleUpdateRoVScore(match.id, 'B', 'wins', parseInt(e.target.value))} className="h-8" />
                              </div>
                              <div>
                                <Label className="text-xs">เสมอ B</Label>
                                <Input type="number" value={match.drawsB || 0} onChange={(e) => handleUpdateRoVScore(match.id, 'B', 'draws', parseInt(e.target.value))} className="h-8" />
                              </div>
                              <div>
                                <Label className="text-xs">แพ้ B</Label>
                                <Input type="number" value={match.lossesB || 0} onChange={(e) => handleUpdateRoVScore(match.id, 'B', 'losses', parseInt(e.target.value))} className="h-8" />
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
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateMatchStatus(match.id, "completed")} disabled={match.status === "completed"}>
                                <Trophy className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteMatch(match.id)}><Trash2 className="h-4 w-4" /></Button>
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
