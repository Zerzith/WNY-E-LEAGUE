
import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp, updateDoc, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Users, Calendar, Trophy, Check, X, Gamepad2, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Event {
  id: string;
  title: string;
  game: string;
  date: string;
  description?: string;
  maxTeams?: number;
  registeredTeams?: number;
  bannerUrl?: string;
  status?: string;
}

interface Registration {
  id: string;
  userId: string;
  teamName: string;
  members: string[];
  logoUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
}

// Sub-component for individual event card in list view to handle real-time registration count
const EventListItem = ({ item, index }: { item: Event, index: number }) => {
  const [registeredCount, setRegisteredCount] = useState(item.registeredTeams || 0);

  useEffect(() => {
    // Listen to approved registrations for this specific event
    const qRegs = query(
      collection(db, "registrations"),
      where("eventId", "==", item.id),
      where("status", "==", "approved")
    );
    
    const unsubRegs = onSnapshot(qRegs, (snapshot) => {
      setRegisteredCount(snapshot.docs.length);
    });

    return () => unsubRegs();
  }, [item.id]);

  const isFull = item.maxTeams ? registeredCount >= item.maxTeams : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/event/${item.id}`}>
        <Card className={`group bg-card/50 border-white/10 hover:border-primary/30 transition-all cursor-pointer overflow-hidden h-full ${isFull ? 'opacity-90' : ''}`}>
          <div className="relative h-48 overflow-hidden">
            <img
              src={item.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full bg-primary text-[10px] font-bold text-white uppercase tracking-wider">
                {item.game}
              </span>
            </div>
            {isFull && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full bg-red-500 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> เต็มแล้ว
                </span>
              </div>
            )}
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{item.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-primary" />
                <span className={isFull ? "text-red-400 font-bold" : ""}>
                  {registeredCount} / {item.maxTeams || 16} ทีม
                </span>
              </div>
            </div>
            <Button className="w-full bg-white/5 hover:bg-primary hover:text-white transition-all border-white/10">
              ดูรายละเอียด
            </Button>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default function EventDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/event/:id");
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [userRegistration, setUserRegistration] = useState<Registration | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [formData, setFormData] = useState({
    teamName: "",
    members: ["", "", ""],
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const eventId = params?.id;

  // Load event data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (eventId) {
        try {
          const eventDoc = await getDoc(doc(db, "events", eventId));
          if (eventDoc.exists()) {
            setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
          }
        } catch (error) {
          console.error("Error loading event:", error);
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const eventsQuery = query(collection(db, "events"), orderBy("createdAt", "desc"));
          const eventsSnapshot = await getDocs(eventsQuery);
          const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
          setAllEvents(events);
        } catch (error) {
          console.error("Error loading events:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [eventId]);

  // Check if user is admin
  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          setIsAdmin(userDoc.data()?.role === "admin");
        } catch (error) {
          console.error("Error checking admin:", error);
        }
      };
      checkAdmin();
    }
  }, [user]);

  // Load registrations for single event view
  useEffect(() => {
    if (!eventId) return;

    const q = query(
      collection(db, "registrations"),
      where("eventId", "==", eventId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const regs = await Promise.all(snapshot.docs.map(async (doc) => {
        const registrationData = { id: doc.id, ...doc.data() } as Registration;
        if (registrationData.logoUrl) return registrationData;

        try {
            const teamQuery = query(collection(db, "teams"), where("name", "==", registrationData.teamName), where("eventId", "==", eventId), limit(1));
            const teamSnapshot = await getDocs(teamQuery);
            if (!teamSnapshot.empty) {
                const teamData = teamSnapshot.docs[0].data();
                if (teamData.logoUrl) {
                    registrationData.logoUrl = teamData.logoUrl;
                }
            }
        } catch (e) {
            console.error("Error fetching team logo:", e);
        }
        return registrationData;
      }));
      setRegistrations(regs);

      // Check if current user has registered
      const userReg = regs.find((reg) => reg.userId === user?.uid);
      setUserRegistration(userReg || null);
    });

    return () => unsubscribe();
  }, [eventId, user]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !eventId || !formData.teamName.trim()) return;

    setIsRegistering(true);
    try {
      await addDoc(collection(db, "registrations"), {
        eventId: eventId,
        userId: user.uid,
        teamName: formData.teamName,
        members: formData.members.filter((m) => m.trim()),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setMessage({ type: "success", text: "ลงสมัครเรียบร้อยแล้ว! รอการอนุมัติจากแอดมิน" });
      setShowRegistrationForm(false);
      setFormData({ teamName: "", members: ["", "", ""] });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error registering:", error);
      setMessage({ type: "error", text: "ไม่สามารถลงสมัครได้" });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleApproveRegistration = async (registrationId: string) => {
    try {
      await updateDoc(doc(db, "registrations", registrationId), {
        status: "approved",
        approvedAt: serverTimestamp(),
      });
      setMessage({ type: "success", text: "อนุมัติการลงสมัครแล้ว" });
    } catch (error) {
      console.error("Error approving:", error);
      setMessage({ type: "error", text: "ไม่สามารถอนุมัติได้" });
    }
  };

  const handleRejectRegistration = async (registrationId: string) => {
    try {
      await updateDoc(doc(db, "registrations", registrationId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });
      setMessage({ type: "success", text: "ปฏิเสธการลงสมัครแล้ว" });
    } catch (error) {
      console.error("Error rejecting:", error);
      setMessage({ type: "error", text: "ไม่สามารถปฏิเสธได้" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground text-lg">กำลังโหลดข้อมูลการแข่งขัน...</p>
        </div>
      </div>
    );
  }

  // List View (When no eventId is provided)
  if (!eventId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปหน้าแรก
          </Button>
          <h1 className="text-4xl font-display font-bold text-white mb-4">รายการแข่งขันทั้งหมด</h1>
          <p className="text-muted-foreground">รวมรายการแข่งขันอีสปอร์ตทั้งหมดของวิทยาลัยเทคนิควังน้ำเย็น</p>
        </div>

        {allEvents.length === 0 ? (
          <div className="text-center py-24 bg-card/20 rounded-[3rem] border border-dashed border-white/10">
            <Gamepad2 className="w-20 h-20 mx-auto text-white/5 mb-6" />
            <h3 className="text-xl font-bold text-white/40">ไม่พบรายการแข่งขันในขณะนี้</h3>
            <Button onClick={() => setLocation("/")} variant="outline" className="mt-6">
              กลับไปหน้าแรก
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allEvents.map((item, index) => (
              <EventListItem key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Detail View (When eventId is provided)
  if (!event) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-4">ไม่พบข้อมูลการแข่งขันที่คุณต้องการ</p>
          <Button onClick={() => setLocation("/events")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ดูรายการแข่งทั้งหมด
          </Button>
        </div>
      </div>
    );
  }

  const approvedCount = registrations.filter((r) => r.status === "approved").length;
  const pendingCount = registrations.filter((r) => r.status === "pending").length;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <Button
        onClick={() => setLocation("/events")}
        variant="ghost"
        className="mb-6 text-muted-foreground hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        กลับไปหน้ารายการ
      </Button>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/20 border border-green-500/50 text-green-300"
              : "bg-red-500/20 border border-red-500/50 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Event Banner */}
      <div className="relative h-80 rounded-3xl overflow-hidden mb-8 border border-white/10 shadow-2xl">
        <img
          src={event.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-4 py-1 rounded-full bg-primary text-xs font-bold text-white uppercase tracking-widest shadow-lg">
              {event.game}
            </span>
            <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg ${
              event.status === 'open' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {event.status === 'open' ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 text-glow">{event.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Event Details */}
          <Card className="bg-card/50 border-white/10 p-8 rounded-3xl backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              รายละเอียดการแข่งขัน
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <Calendar className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">วันที่แข่งขัน</p>
                  <p className="text-white font-medium">{event.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <Users className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">ทีมที่ลงสมัคร</p>
                  <p className="text-white font-medium">
                    {approvedCount} / {event.maxTeams || 16} ทีม
                  </p>
                </div>
              </div>
            </div>
            {event.description && (
              <div className="pt-6 border-t border-white/10">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </Card>

          {/* Registration Form */}
          {user && !userRegistration && event.status === 'open' && !showRegistrationForm && (
            <Button
              onClick={() => setShowRegistrationForm(true)}
              className="w-full bg-primary hover:bg-primary/80 py-8 text-xl font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              ลงสมัครเข้าแข่งขันตอนนี้
            </Button>
          )}

          {showRegistrationForm && (
            <Card className="bg-card/50 border-white/10 p-8 rounded-3xl backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white mb-6">ฟอร์มลงสมัคร</h2>
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-white/60 uppercase tracking-wider mb-2">ชื่อทีม</label>
                  <Input
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    placeholder="ระบุชื่อทีมของคุณ"
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/60 uppercase tracking-wider mb-2">รายชื่อสมาชิกทีม (ขั้นต่ำ 3 คน)</label>
                  <div className="space-y-3">
                    {formData.members.map((member, index) => (
                      <Input
                        key={index}
                        value={member}
                        onChange={(e) => {
                          const newMembers = [...formData.members];
                          newMembers[index] = e.target.value;
                          setFormData({ ...formData, members: newMembers });
                        }}
                        placeholder={`ชื่อสมาชิกคนที่ ${index + 1}`}
                        className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary"
                        required={index < 3}
                      />
                    ))}
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3 text-xs text-primary hover:text-primary/80"
                    onClick={() => setFormData({ ...formData, members: [...formData.members, ""] })}
                  >
                    + เพิ่มสมาชิกสำรอง
                  </Button>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowRegistrationForm(false)}
                    className="h-12 px-6 rounded-xl"
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={isRegistering} className="bg-primary hover:bg-primary/80 h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20">
                    {isRegistering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    ยืนยันการลงสมัคร
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {userRegistration && (
            <Card className="bg-card/50 border-white/10 p-8 rounded-3xl text-center border-primary/20 bg-primary/5 backdrop-blur-md">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">คุณได้ลงสมัครการแข่งขันนี้แล้ว</h2>
              <p className="text-muted-foreground mb-4">ทีมของคุณ: <span className="text-white font-bold">{userRegistration.teamName}</span></p>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <span className="text-sm text-muted-foreground mr-2">สถานะ:</span>
                <span className={`text-sm font-black uppercase tracking-widest ${
                  userRegistration.status === 'approved' ? 'text-green-400' :
                  userRegistration.status === 'pending' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>{userRegistration.status === 'approved' ? 'อนุมัติแล้ว' : userRegistration.status === 'pending' ? 'รอการตรวจสอบ' : 'ไม่ผ่านการคัดเลือก'}</span>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Approved Teams */}
          <Card className="bg-card/50 border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              ทีมที่เข้าร่วม ({approvedCount})
            </h3>
            <div className="space-y-3">
              {registrations.filter(r => r.status === 'approved').map((reg, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-white font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                    {reg.logoUrl ? (
                      <img src={reg.logoUrl} alt={reg.teamName} className="w-full h-full object-cover" />
                    ) : (
                      reg.teamName.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold">{reg.teamName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Verified Team</p>
                  </div>
                </div>
              ))}
              {approvedCount === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm italic">ยังไม่มีทีมที่ได้รับการอนุมัติ</p>
                </div>
              )}
            </div>
          </Card>

          {/* Pending Teams (Admin only) */}
          {isAdmin && pendingCount > 0 && (
            <Card className="bg-card/50 border-white/10 p-6 rounded-3xl border-yellow-500/20 backdrop-blur-md">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                รออนุมัติ ({pendingCount})
              </h3>
              <div className="space-y-4">
                {registrations.filter(r => r.status === 'pending').map((reg, index) => (
                  <div key={index} className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-white font-bold overflow-hidden">
                          {reg.logoUrl ? (
                            <img src={reg.logoUrl} alt={reg.teamName} className="w-full h-full object-cover" />
                          ) : (
                            reg.teamName.charAt(0)
                          )}
                        </div>
                        <p className="text-white font-bold">{reg.teamName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-9" onClick={() => handleApproveRegistration(reg.id)}>
                        <Check className="w-3 h-3 mr-1" /> อนุมัติ
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs h-9" onClick={() => handleRejectRegistration(reg.id)}>
                        <X className="w-3 h-3 mr-1" /> ปฏิเสธ
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
