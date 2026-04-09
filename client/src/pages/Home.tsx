import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Swords, Users, Calendar, ArrowRight, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Home() {
  const [latestEvents, setLatestEvents] = useState<any[]>([]);
  const [champions, setChampions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch latest events
    const qEvents = query(collection(db, "events"), orderBy("createdAt", "desc"), limit(3));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      setLatestEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // Fetch events with champions
    const qChampions = query(collection(db, "events"), where("championTeamId", "!=", null), limit(5));
    const unsubChampions = onSnapshot(qChampions, async (snap) => {
      const champsData = await Promise.all(snap.docs.map(async (d) => {
        const eventData = d.data();
        // We'll need to fetch the team name separately if we want it here, 
        // but for now we can just show the event title and that it has a champion
        return { id: d.id, ...eventData };
      }));
      setChampions(champsData);
    });

    return () => {
      unsubEvents();
      unsubChampions();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6"
            >
              <Gamepad2 className="w-4 h-4" />
              WANGNAMYEN ESPORTS LEAGUE
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight"
            >
              ยกระดับการแข่งขัน <br />
              <span className="text-primary">ESPORTS</span> ในโรงเรียน
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground mb-8 leading-relaxed"
            >
              แพลตฟอร์มจัดการแข่งขันอีสปอร์ตสำหรับนักเรียนโรงเรียนวังน้ำเย็นวิทยาคม 
              ติดตามสายการแข่งขัน ผลการแข่ง และทำเนียบแชมป์เปี้ยนได้ที่นี่
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/bracket">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 h-14 rounded-2xl text-lg font-bold">
                  ดูสายการแข่งขัน
                </Button>
              </Link>
              <Link href="/rules">
                <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 px-8 h-14 rounded-2xl text-lg font-bold">
                  กฎการแข่งขัน
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Champions Section */}
      {champions.length > 0 && (
        <section className="py-20 bg-white/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-12">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h2 className="text-3xl font-bold text-white">ทำเนียบแชมป์เปี้ยน</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {champions.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/event/${event.id}`}>
                    <Card className="bg-gradient-to-br from-yellow-500/20 via-yellow-500/5 to-transparent border-yellow-500/30 p-8 rounded-3xl text-center cursor-pointer hover:scale-[1.02] transition-all group">
                      <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4 group-hover:animate-bounce" />
                      <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                      <p className="text-yellow-500 font-black text-2xl uppercase tracking-tighter">CHAMPION</p>
                      <div className="mt-4 inline-flex items-center text-sm text-muted-foreground group-hover:text-white transition-colors">
                        ดูรายละเอียด <ArrowRight className="ml-2 w-4 h-4" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Events Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <Swords className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-white">การแข่งขันล่าสุด</h2>
            </div>
            <Link href="/bracket">
              <Button variant="ghost" className="text-primary hover:text-primary/80 font-bold">
                ดูทั้งหมด <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/event/${event.id}`}>
                  <Card className="bg-card/50 border-white/10 overflow-hidden hover:border-primary/30 transition-all cursor-pointer group h-full">
                    <div className="relative h-48">
                      <img 
                        src={event.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"} 
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-primary text-[10px] font-bold text-white uppercase tracking-wider">
                          {event.game}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-4 group-hover:text-primary transition-colors">{event.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{event.maxTeams || 16} ทีม</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Swords className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Real-time Bracket</h3>
              <p className="text-muted-foreground">ติดตามสายการแข่งขันและผลการแข่งแบบสดๆ ทันทีที่มีการอัปเดต</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Team Management</h3>
              <p className="text-muted-foreground">ลงทะเบียนทีมและจัดการสมาชิกได้อย่างง่ายดายผ่านระบบออนไลน์</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Hall of Fame</h3>
              <p className="text-muted-foreground">บันทึกประวัติศาสตร์และเกียรติยศของทีมที่คว้าแชมป์ในแต่ละรายการ</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
