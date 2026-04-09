import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, getDocs, getDoc, doc } from "firebase/firestore";
import { TeamMembersModal } from "@/components/TeamMembersModal";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Loader2, Trophy, Swords, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { censorText } from "@/lib/filter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Match {
  id: string;
  round: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: "pending" | "ongoing" | "completed";
  tournamentId: string;
  group?: string;
  teamAName?: string;
  teamBName?: string;
  logoUrlA?: string;
  logoUrlB?: string;
  game?: string;
  winsA?: number;
  winsB?: number;
  lossesA?: number;
  lossesB?: number;
  drawsA?: number;
  drawsB?: number;
  createdAt?: any;
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
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);

  // Fetch registrations
  useEffect(() => {
    if (!selectedTournament) return;
    
    const q = query(
      collection(db, "registrations"),
      where("eventId", "==", selectedTournament.id),
      where("status", "==", "approved")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as any));
      setRegistrations(regs);
    });
    
    return () => unsubscribe();
  }, [selectedTournament]);

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
      where("eventId", "==", selectedTournament.id)
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let matchesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as any));

      // Sort matches client-side by createdAt
      matchesData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });
      
      // Fetch team names and logos from registrations collection
      const matchesWithLogos = await Promise.all(
        matchesData.map(async (match) => {
          try {
            // ดึงข้อมูลทีม A จาก registrations โดยใช้ registration document ID
            const teamADoc = await getDoc(doc(db, "registrations", match.teamA));
            const teamAData = teamADoc.exists() ? teamADoc.data() : null;
            
            // ดึงข้อมูลทีม B จาก registrations โดยใช้ registration document ID
            const teamBDoc = await getDoc(doc(db, "registrations", match.teamB));
            const teamBData = teamBDoc.exists() ? teamBDoc.data() : null;
            
            return {
              ...match,
              teamAName: teamAData?.teamName || match.teamA,
              teamBName: teamBData?.teamName || match.teamB,
              logoUrlA: teamAData?.logoUrl || undefined,
              logoUrlB: teamBData?.logoUrl || undefined,
            };
          } catch (error) {
            console.error("Error fetching team data for match:", match.id, error);
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
                const roundKey = match.round || "1";
                if (!acc[roundKey]) {
                  acc[roundKey] = [];
                }
                acc[roundKey].push(match);
                return acc;
              }, {} as Record<string, Match[]>);

              // Get unique rounds in order of appearance
              const rounds = Array.from(new Set(filteredMatches.map(m => m.round || "1")));

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
                                  {round}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-8">
                              {matchesByRound[round].map((match) => (
                                <BracketMatch 
                                  key={match.id} 
                                  match={match} 
                                  tournamentGame={selectedTournament?.game}
                                  registrations={registrations}
                                  onTeamClick={(team) => {
                                    setSelectedTeam(team);
                                    setShowTeamModal(true);
                                  }}
                                />
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

      {/* Team Members Modal */}
      {selectedTeam && (
        <TeamMembersModal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          teamName={selectedTeam.teamName}
          teamLogo={selectedTeam.logoUrl}
          members={selectedTeam.members}
        />
      )}
    </div>
  );
}

interface BracketMatchProps {
  match: Match;
  tournamentGame?: string;
  registrations?: any[];
  onTeamClick?: (team: any) => void;
}

function BracketMatch({ match, tournamentGame, registrations = [], onTeamClick }: BracketMatchProps) {
  const isCompleted = match.status === "completed";
  const isOngoing = match.status === "ongoing";
  const isPending = match.status === "pending";
  
  // Check if this is a RoV match - use tournament game name as primary source
  const gameNameToCheck = tournamentGame || match.game || '';
  const isRoV = gameNameToCheck.toLowerCase().includes('rov') || gameNameToCheck.toLowerCase().includes('realm');
  const hasRoVData = match.winsA !== undefined && match.winsB !== undefined;
  
  // Debug logging
  if (match.status === 'completed') {
    console.log(`Match ${match.id}: game='${gameNameToCheck}', isRoV=${isRoV}, hasRoVData=${hasRoVData}, winsA=${match.winsA}, winsB=${match.winsB}`);
  }
  
  // For RoV: determine winner based on wins
  const rovWinnerA = isCompleted && hasRoVData && (match.winsA || 0) > (match.winsB || 0);
  const rovWinnerB = isCompleted && hasRoVData && (match.winsB || 0) > (match.winsA || 0);
  
  // For regular games: determine winner based on score
  const regularWinnerA = isCompleted && !hasRoVData && match.scoreA > match.scoreB;
  const regularWinnerB = isCompleted && !hasRoVData && match.scoreB > match.scoreA;
  
  const winnerA = hasRoVData ? rovWinnerA : regularWinnerA;
  const winnerB = hasRoVData ? rovWinnerB : regularWinnerB;
  
  const getStatusBadge = () => {
    if (isOngoing) {
      return {
        text: "กำลังดำเนินการ",
        bgColor: "bg-red-600",
        textColor: "text-white",
        animate: "animate-pulse"
      };
    }
    if (isCompleted) {
      return {
        text: "จบการแข่งขันแล้ว",
        bgColor: "bg-green-600",
        textColor: "text-white",
        animate: ""
      };
    }
    return {
      text: "ยังไม่เริ่ม",
      bgColor: "bg-gray-600",
      textColor: "text-white",
      animate: ""
    };
  };
  
  const statusBadge = getStatusBadge();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <Card
        className={`w-64 md:w-72 bg-card/80 backdrop-blur-md border-white/10 transition-all duration-500 hover:border-primary/50 group ${
          isOngoing ? "ring-2 ring-red-500/50 border-red-500/50" : ""
        } ${isCompleted ? "shadow-2xl shadow-black/50" : ""}`}
      >
        {/* Match Status Badge - Positioned to not overlap scores */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className={`px-3 py-1 rounded-full ${statusBadge.bgColor} ${statusBadge.textColor} text-[9px] font-black uppercase tracking-[0.1em] border border-white/10 shadow-lg backdrop-blur-md ${statusBadge.animate}`}>
            {statusBadge.text}
          </div>
        </div>

        {/* Team A */}
        <div
          className={`flex justify-between items-center p-4 border-b border-white/5 transition-colors ${
            winnerA ? "bg-primary/20 border-b-primary/50" : ""
          } ${winnerA ? "ring-1 ring-primary/30" : ""}`}
        >
          <button
            onClick={() => {
              const teamA = registrations.find(r => r.id === match.teamA);
              if (teamA) onTeamClick?.(teamA);
            }}
            className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs overflow-hidden ${winnerA ? 'bg-primary text-white' : 'bg-white/5 text-white/40'}`}>
              {match.logoUrlA ? (
                <img src={match.logoUrlA} alt={match.teamA} className="w-full h-full object-cover" />
              ) : (
                censorText(match.teamA).charAt(0)
              )}
            </div>
            <span className={`font-bold truncate text-sm ${winnerA ? "text-primary font-black" : "text-white/40"}`}>
              {match.teamAName || match.teamA || "TBD"}
            </span>
          </button>
          <div className="flex items-center gap-2">
            {isRoV ? (
              <div className="flex items-center gap-2 text-xs font-bold">
                {match.winsA === 1 && match.drawsA === 0 && match.lossesA === 0 ? (
                  <span className="text-green-400 px-2 py-1 bg-green-400/10 rounded border border-green-400/30">ชนะ</span>
                ) : match.drawsA === 1 && match.winsA === 0 && match.lossesA === 0 ? (
                  <span className="text-yellow-400 px-2 py-1 bg-yellow-400/10 rounded border border-yellow-400/30">เสมอ</span>
                ) : match.lossesA === 1 && match.winsA === 0 && match.drawsA === 0 ? (
                  <span className="text-red-400 px-2 py-1 bg-red-400/10 rounded border border-red-400/30">แพ้</span>
                ) : (
                  <span className="text-white/40 px-2 py-1 bg-white/5 rounded border border-white/10">-</span>
                )}
              </div>
            ) : (
              <span className={`font-mono font-black text-lg ${winnerA ? "text-primary" : "text-white/20"}`}>
                {match.scoreA}
              </span>
            )}
            {winnerB && (
              <div className="text-xs font-bold px-2 py-1 bg-primary/30 text-primary rounded border border-primary/50">👑</div>
            )}
          </div>
        </div>

        {/* Team B */}
        <div
          className={`flex justify-between items-center p-4 transition-colors ${
            winnerB ? "bg-primary/20 border-t-primary/50" : ""
          } ${winnerB ? "ring-1 ring-primary/30" : ""}`}
        >
          <button
            onClick={() => {
              const teamB = registrations.find(r => r.id === match.teamB);
              if (teamB) onTeamClick?.(teamB);
            }}
            className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs overflow-hidden ${winnerB ? 'bg-primary text-white' : 'bg-white/5 text-white/40'}`}>
              {match.logoUrlB ? (
                <img src={match.logoUrlB} alt={match.teamB} className="w-full h-full object-cover" />
              ) : (
                censorText(match.teamB).charAt(0)
              )}
            </div>
            <span className={`font-bold truncate text-sm ${winnerB ? "text-primary font-black" : "text-white/40"}`}>
              {match.teamBName || match.teamB || "TBD"}
            </span>
          </button>
          <div className="flex items-center gap-2">
            {isRoV ? (
              <div className="flex items-center gap-2 text-xs font-bold">
                {match.winsB === 1 && match.drawsB === 0 && match.lossesB === 0 ? (
                  <span className="text-green-400 px-2 py-1 bg-green-400/10 rounded border border-green-400/30">ชนะ</span>
                ) : match.drawsB === 1 && match.winsB === 0 && match.lossesB === 0 ? (
                  <span className="text-yellow-400 px-2 py-1 bg-yellow-400/10 rounded border border-yellow-400/30">เสมอ</span>
                ) : match.lossesB === 1 && match.winsB === 0 && match.drawsB === 0 ? (
                  <span className="text-red-400 px-2 py-1 bg-red-400/10 rounded border border-red-400/30">แพ้</span>
                ) : (
                  <span className="text-white/40 px-2 py-1 bg-white/5 rounded border border-white/10">-</span>
                )}
              </div>
            ) : (
              <span className={`font-mono font-black text-lg ${winnerB ? "text-primary" : "text-white/20"}`}>
                {match.scoreB}
              </span>
            )}
            {winnerB && (
              <div className="text-xs font-bold px-2 py-1 bg-primary/30 text-primary rounded border border-primary/50">👑</div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
