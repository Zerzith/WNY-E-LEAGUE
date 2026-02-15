import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Loader2, Trophy, Swords, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { censorText } from "@/lib/filter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Match {
  id: string;
  round: number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: "pending" | "ongoing" | "completed";
  tournamentId: string;
  group?: string;
  logoUrlA?: string;
  logoUrlB?: string;
}

interface Tournament {
  id: string;
  title: string;
  game: string;
  status: string;
}

export default function Bracket() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<string[]>(["All"]);

  // Fetch tournaments
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tournamentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as any));
      setTournaments(tournamentsData);
      if (tournamentsData.length > 0 && !selectedTournament) {
        setSelectedTournament(tournamentsData[0]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch matches for selected tournament with logos
  useEffect(() => {
    if (!selectedTournament) return;

    const q = query(
      collection(db, "matches"),
      where("tournamentId", "==", selectedTournament.id),
      orderBy("round", "asc")
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const matchesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as any));
      
      // Fetch team logos from registrations
      const matchesWithLogos = await Promise.all(
        matchesData.map(async (match) => {
          try {
            const registrationsQuery = query(
              collection(db, "registrations"),
              where("teamName", "in", [match.teamA, match.teamB])
            );
            
            const registrationsSnapshot = await getDocs(registrationsQuery);
            const registrations: any = {};
            
            registrationsSnapshot.docs.forEach(doc => {
              registrations[doc.data().teamName] = doc.data().logoUrl;
            });
            
            return {
              ...match,
              logoUrlA: registrations[match.teamA] || undefined,
              logoUrlB: registrations[match.teamB] || undefined,
            };
          } catch (error) {
            console.error("Error fetching logos for match:", match.id, error);
            return match;
          }
        })
      );
      
      setMatches(matchesWithLogos);
      
      // ดึงรายชื่อกลุ่มที่มีทั้งหมด
      const uniqueGroups = Array.from(new Set(matchesWithLogos.map(m => m.group || "General")));
      setGroups(["All", ...uniqueGroups]);
    }, (error) => {
      console.error("Error fetching matches:", error);
    });

    return () => unsubscribe();
  }, [selectedTournament]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">กำลังโหลดข้อมูลสายการแข่งขันแบบเรียลไทม์...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-4"
          >
            <Swords className="w-4 h-4" />
            REAL-TIME TOURNAMENT BRACKET
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight">
            สายการแข่งขัน
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            ติดตามผลการแข่งขันแบบสดๆ โดยไม่ต้องรีเฟรชหน้าจอ
          </p>
        </div>

        {/* Tournament Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tournaments.map((tournament) => (
            <button
              key={tournament.id}
              onClick={() => setSelectedTournament(tournament)}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 border ${
                selectedTournament?.id === tournament.id
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                  : "bg-card/50 text-white/60 border-white/5 hover:border-white/20 hover:text-white"
              }`}
            >
              {tournament.title}
            </button>
          ))}
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-24 bg-card/20 rounded-[2rem] border border-dashed border-white/10">
            <Trophy className="w-16 h-16 mx-auto text-white/10 mb-4" />
            <p className="text-muted-foreground text-lg">ยังไม่มีข้อมูลการแข่งขันในขณะนี้</p>
          </div>
        ) : (
          <Tabs defaultValue="All" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-white/5 border border-white/10 p-1">
                {groups.map(group => (
                  <TabsTrigger key={group} value={group} className="data-[state=active]:bg-primary data-[state=active]:text-white px-6">
                    {group === "All" ? "ทั้งหมด" : `กลุ่ม ${group}`}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {groups.map(group => {
              const filteredMatches = matches.filter(m => group === "All" || (m.group || "General") === group);
              
              // Group matches by round for this group
              const matchesByRound = filteredMatches.reduce((acc, match) => {
                if (!acc[match.round]) {
                  acc[match.round] = [];
                }
                acc[match.round].push(match);
                return acc;
              }, {} as Record<number, Match[]>);

              const rounds = Object.keys(matchesByRound)
                .map(Number)
                .sort((a, b) => a - b);

              return (
                <TabsContent key={group} value={group} className="mt-0">
                  {filteredMatches.length === 0 ? (
                    <div className="text-center py-24 bg-card/20 rounded-[2rem] border border-dashed border-white/10">
                      <LayoutGrid className="w-16 h-16 mx-auto text-white/10 mb-4" />
                      <p className="text-muted-foreground text-lg">ยังไม่มีข้อมูลการแข่งขันในกลุ่มนี้</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto pb-12 scrollbar-hide">
                      <div className="min-w-max flex justify-center gap-12 md:gap-20 py-8 px-4">
                        {rounds.map((round, roundIndex) => (
                          <div key={round} className="flex flex-col justify-around gap-8">
                            <div className="text-center mb-4">
                              <div className="inline-block px-4 py-1 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">
                                  {roundIndex === rounds.length - 1
                                    ? "Finals"
                                    : roundIndex === rounds.length - 2
                                    ? "Semi-Finals"
                                    : `Round ${round}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-8">
                              {matchesByRound[round].map((match) => (
                                <BracketMatch key={match.id} match={match} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}

function BracketMatch({ match }: { match: Match }) {
  const isCompleted = match.status === "completed";
  const isOngoing = match.status === "ongoing";
  const winnerA = isCompleted && match.scoreA > match.scoreB;
  const winnerB = isCompleted && match.scoreB > match.scoreA;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <Card
        className={`w-64 md:w-72 bg-card/80 backdrop-blur-md border-white/10 overflow-hidden transition-all duration-500 hover:border-primary/50 group ${
          isOngoing ? "ring-2 ring-red-500/50 border-red-500/50" : ""
        } ${isCompleted ? "shadow-2xl shadow-black/50" : ""}`}
      >
        {/* Match Status Indicator */}
        {isOngoing && (
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-600 text-[8px] font-black text-white uppercase tracking-tighter animate-pulse rounded-bl-lg">
            LIVE
          </div>
        )}

        {/* Team A */}
        <div
          className={`flex justify-between items-center p-4 border-b border-white/5 transition-colors ${
            winnerA ? "bg-primary/10" : ""
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs overflow-hidden ${winnerA ? 'bg-primary text-white' : 'bg-white/5 text-white/40'}`}>
              {match.logoUrlA ? (
                <img src={match.logoUrlA} alt={match.teamA} className="w-full h-full object-cover" />
              ) : (
                censorText(match.teamA).charAt(0)
              )}
            </div>
            <span className={`font-bold truncate text-sm ${winnerA ? "text-white" : "text-white/40"}`}>
              {censorText(match.teamA) || "TBD"}
            </span>
          </div>
          <span className={`font-mono font-black text-lg ${winnerA ? "text-primary" : "text-white/20"}`}>
            {match.scoreA}
          </span>
        </div>

        {/* Team B */}
        <div
          className={`flex justify-between items-center p-4 transition-colors ${
            winnerB ? "bg-primary/10" : ""
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs overflow-hidden ${winnerB ? 'bg-primary text-white' : 'bg-white/5 text-white/40'}`}>
              {match.logoUrlB ? (
                <img src={match.logoUrlB} alt={match.teamB} className="w-full h-full object-cover" />
              ) : (
                censorText(match.teamB).charAt(0)
              )}
            </div>
            <span className={`font-bold truncate text-sm ${winnerB ? "text-white" : "text-white/40"}`}>
              {censorText(match.teamB) || "TBD"}
            </span>
          </div>
          <span className={`font-mono font-black text-lg ${winnerB ? "text-primary" : "text-white/20"}`}>
            {match.scoreB}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
