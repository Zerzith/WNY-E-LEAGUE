
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp, updateDoc, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Users, Calendar, Trophy, Check, X } from "lucide-react";

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
      if (eventId) {
        try {
          const eventDoc = await getDoc(doc(db, "events", eventId));
          if (eventDoc.exists()) {
            setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
          }
          setLoading(false);
        } catch (error) {
          console.error("Error loading event:", error);
          setLoading(false);
        }
      } else {
        try {
          const eventsQuery = query(collection(db, "events"));
          const eventsSnapshot = await getDocs(eventsQuery);
          const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
          setAllEvents(events);
          setLoading(false);
        } catch (error) {
          console.error("Error loading events:", error);
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

  // Load registrations
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
      setLoading(false);
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
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-4">ไม่พบการแข่งขัน</p>
          <Button onClick={() => setLocation("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปหน้าแรก
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
        onClick={() => setLocation("/")}
        variant="ghost"
        className="mb-6 text-muted-foreground hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        กลับไป
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
      <div className="relative h-64 rounded-lg overflow-hidden mb-8">
        <img
          src={event.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">{event.title}</h1>
          <p className="text-lg text-white/80">{event.game}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Event Details */}
          <Card className="bg-card/50 border-white/10 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">รายละเอียดการแข่งขัน</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">วันที่</p>
                  <p className="text-white font-medium">{event.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Users className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">ทีมที่ลงสมัคร</p>
                  <p className="text-white font-medium">
                    {approvedCount} / {event.maxTeams || "ไม่จำกัด"} ทีม
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Trophy className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">สถานะ</p>
                  <p className="text-white font-medium capitalize">{event.status}</p>
                </div>
              </div>
            </div>
            {event.description && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-muted-foreground">{event.description}</p>
              </div>
            )}
          </Card>

          {/* Registration Form */}
          {user && !userRegistration && !showRegistrationForm && (
            <Button
              onClick={() => setShowRegistrationForm(true)}
              className="w-full bg-primary hover:bg-primary/80 py-6 text-lg"
            >
              ลงสมัครเข้าแข่งขัน
            </Button>
          )}

          {showRegistrationForm && (
            <Card className="bg-card/50 border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-4">ฟอร์มลงสมัคร</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">ชื่อทีม</label>
                  <Input
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    placeholder="ชื่อทีมของคุณ"
                    className="bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">สมาชิกทีม</label>
                  <div className="space-y-2">
                    {formData.members.map((member, index) => (
                      <Input
                        key={index}
                        value={member}
                        onChange={(e) => {
                          const newMembers = [...formData.members];
                          newMembers[index] = e.target.value;
                          setFormData({ ...formData, members: newMembers });
                        }}
                        placeholder={`สมาชิกที่ ${index + 1}`}
                        className="bg-white/5 border-white/10"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowRegistrationForm(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={isRegistering} className="bg-primary hover:bg-primary/80">
                    {isRegistering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    ยืนยันการสมัคร
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {userRegistration && (
            <Card className="bg-card/50 border-white/10 p-6 text-center">
              <h2 className="text-xl font-bold text-white mb-2">คุณได้ลงสมัครแล้ว</h2>
              <p className="text-muted-foreground">
                สถานะ: <span className={`font-bold ${
                  userRegistration.status === 'approved' ? 'text-green-400' :
                  userRegistration.status === 'pending' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>{userRegistration.status}</span>
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Approved Teams */}
          <Card className="bg-card/50 border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">ทีมที่เข้าร่วม ({approvedCount})</h3>
            <div className="space-y-4">
              {registrations.filter(r => r.status === 'approved').map((reg, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-white font-bold overflow-hidden">
                    {reg.logoUrl ? (
                      <img src={reg.logoUrl} alt={reg.teamName} className="w-full h-full object-cover" />
                    ) : (
                      reg.teamName.charAt(0)
                    )}
                  </div>
                  <p className="text-white font-medium">{reg.teamName}</p>
                </div>
              ))}
              {approvedCount === 0 && <p className="text-muted-foreground text-sm">ยังไม่มีทีมที่ได้รับการอนุมัติ</p>}
            </div>
          </Card>

          {/* Pending Teams (Admin only) */}
          {isAdmin && pendingCount > 0 && (
            <Card className="bg-card/50 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">ทีมที่รออนุมัติ ({pendingCount})</h3>
              <div className="space-y-4">
                {registrations.filter(r => r.status === 'pending').map((reg, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-white font-bold overflow-hidden">
                        {reg.logoUrl ? (
                          <img src={reg.logoUrl} alt={reg.teamName} className="w-full h-full object-cover" />
                        ) : (
                          reg.teamName.charAt(0)
                        )}
                      </div>
                      <p className="text-white font-medium">{reg.teamName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="text-green-400 hover:bg-green-500/20 hover:text-green-300" onClick={() => handleApproveRegistration(reg.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-400 hover:bg-red-500/20 hover:text-red-300" onClick={() => handleRejectRegistration(reg.id)}>
                        <X className="w-4 h-4" />
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
