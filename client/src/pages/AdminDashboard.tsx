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
import { Loader2, Plus, Trash2, Calendar, Users, Trophy } from "lucide-react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for new event
  const [newTitle, setNewTitle] = useState("");
  const [newGame, setNewGame] = useState("Valorant");
  const [newMaxTeams, setNewMaxTeams] = useState("16");
  const [newMembers, setNewMembers] = useState("5");
  const [newSubs, setNewSubs] = useState("1");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    if (!user) return;

    const qEvents = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qTeams = query(collection(db, "teams"), orderBy("createdAt", "desc"));
    const unsubTeams = onSnapshot(qTeams, (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubEvents();
      unsubTeams();
    };
  }, [user]);

  if (authLoading || (user && loading)) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  if (!user || user.role !== "admin") {
    setLocation("/");
    return null;
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
        createdAt: new Date().toISOString()
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

  const handleApproveTeam = async (id: string) => {
    try {
      await updateDoc(doc(db, "teams", id), { status: "approved" });
      toast({ title: "อนุมัติทีมเรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาด", variant: "destructive" });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("ยืนยันการลบทีม?")) return;
    try {
      await deleteDoc(doc(db, "teams", id));
      toast({ title: "ลบทีมเรียบร้อย" });
    } catch (error) {
      toast({ title: "ลบไม่สำเร็จ", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white font-display">แผงควบคุมผู้ดูแลระบบ</h1>
      </div>
      
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-card/50 border border-white/5">
          <TabsTrigger value="events" className="data-[state=active]:bg-primary">การแข่งขัน</TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-primary">จัดการทีม</TabsTrigger>
          <TabsTrigger value="matches" className="data-[state=active]:bg-primary">อัปเดตคะแนน</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">
          <Card className="bg-card border-white/10">
            <CardHeader>
              <CardTitle>สร้างการแข่งขันใหม่</CardTitle>
              <CardDescription>กำหนดรายละเอียดและกติกาการแข่งขัน</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ชื่อรายการ</Label>
                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="เช่น Valorant College Cup" required />
                  </div>
                  <div className="space-y-2">
                    <Label>เลือกเกม</Label>
                    <Select value={newGame} onValueChange={setNewGame}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Valorant">Valorant</SelectItem>
                        <SelectItem value="RoV">RoV</SelectItem>
                        <SelectItem value="Free Fire">Free Fire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>วันที่แข่งขัน</Label>
                    <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>จำนวนทีมสูงสุด</Label>
                      <Input type="number" value={newMaxTeams} onChange={e => setNewMaxTeams(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>สมาชิกหลัก/ทีม</Label>
                      <Input type="number" value={newMembers} onChange={e => setNewMembers(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>ตัวสำรองสูงสุด/ทีม</Label>
                    <Input type="number" value={newSubs} onChange={e => setNewSubs(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full bg-primary mt-6">
                    <Plus className="w-4 h-4 mr-2" /> สร้างรายการ
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="text-primary" /> รายการที่กำลังมาถึง</h2>
            {events.map(event => (
              <Card key={event.id} className="bg-card/50 border-white/10 hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {event.game.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{event.title}</h3>
                      <p className="text-xs text-muted-foreground">{event.game} • {event.date} • รับ {event.maxTeams} ทีม</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <Card className="bg-card border-white/10">
            <CardHeader>
              <CardTitle>รายชื่อทีมที่สมัคร</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teams.map(team => (
                  <div key={team.id} className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-background/30">
                    <div className="flex items-center gap-4">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center font-bold">{team.name.charAt(0)}</div>
                      )}
                      <div>
                        <h3 className="font-bold text-white">{team.name}</h3>
                        <p className="text-xs text-muted-foreground">{team.game} • {team.status === 'approved' ? <span className="text-green-500">อนุมัติแล้ว</span> : <span className="text-yellow-500">รอการตรวจสอบ</span>}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {team.status !== 'approved' && (
                        <Button size="sm" onClick={() => handleApproveTeam(team.id)}>อนุมัติ</Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches">
          <Card className="bg-card border-white/10">
            <CardHeader>
              <CardTitle>อัปเดตคะแนนเรียลไทม์</CardTitle>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>กรุณาเลือกรายการแข่งขันเพื่อจัดการตารางแข่งและคะแนนสด</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
