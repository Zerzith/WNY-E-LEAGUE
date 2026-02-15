import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Loader2, Trophy, Swords, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { censorText } from "@/lib/filter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarCustom } from "@/components/ui/avatar-custom";

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
  maxTeams?: number;
}

export default function Bracket() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<string[]>(["All"]);
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  const [registeredTeamCount, setRegisteredTeamCount] = useState(0);

  // Fetch tournaments
  useEffect(() => {
    const q = query(collection(db, "events"));
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

  // Fetch team logos and count
  useEffect(() => {
    if (!selectedTournament) return;

    const registrationsQuery = query(
      collection(db, "registrations"),
      where("eventId", "==", selectedTournament.id),
      where("status", "==", "approved")
    );

    const unsubscribe = onSnapshot(registrationsQuery, (snapshot) => {
      const logos: Record<string, string> = {};
      snapshot.docs.forEach((doc) => {
        const reg = doc.data();
        if (reg.teamName && reg.logoUrl) {
          logos[reg.teamName] = reg.logoUrl;
        }
      });
      setTeamLogos(logos);
      setRegisteredTeamCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [selectedTournament]);

  // Fetch matches for selected tournament
  useEffect(() => {
    if (!selectedTournament) return;

    const q = query(
      collection(db, "matches"),
      where("tournamentId", "==", selectedTournament.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          logoUrlA: teamLogos[data.teamA] || "",
          logoUrlB: teamLogos[data.teamB] || "",
        } as Match;
      });
      
      const sortedMatches = matchesData.sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        return (a.group || "").localeCompare(b.group || "");
      });
      
      setMatches(sortedMatches);
      
      const uniqueGroups = Array.from(new Set(matchesData.map(m => m.group || "General")));
      setGroups(["All", ...uniqueGroups]);
    });

    return () => unsubscribe();
  }, [selectedTournament, teamLogos]);

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
          <p className="text-white/60 text-lg">ติดตามผลการแข่งขันแบบเรียลไทม์</p>
        </div>

        {/* Tournament Selector */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <select
            value={selectedTournament?.id || ""}
            onChange={(e) => {
              const tournament = tournaments.find(t => t.id === e.target.value);
              setSelectedTournament(tournament || null);
            }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          >
            {tournaments.map(tournament => (
              <option key={tournament.id} value={tournament.id} className="bg-background">
                {tournament.title} ({tournament.game})
              </option>
            ))}
          </select>
          
          {selectedTournament && (
            <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary font-semibold">
              ทีมที่ลงทะเบียน: {registeredTeamCount}/{selectedTournament.maxTeams || "∞"}
            </div>
          )}
        </div>

        {/* Matches Display */}
        {matches.length > 0 ? (
          <div className="space-y-8">
            {matches.map((match) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative"
              >
                <Card className="bg-card/50 border-white/10 overflow-hidden hover:border-primary/30 transition-colors">
                  {/* Team A */}
                  <div className="flex justify-between items-center p-4 border-b border-white/5">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <AvatarCustom 
                        src={match.logoUrlA} 
                        name={match.teamA} 
                        size="md"
                      />
                      <span className="font-bold truncate text-sm text-white">
                        {censorText(match.teamA) || "TBD"}
                      </span>
                    </div>
                    <span className="font-mono font-black text-lg text-white">
                      {match.scoreA}
                    </span>
                  </div>

                  {/* Team B */}
                  <div className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <AvatarCustom 
                        src={match.logoUrlB} 
                        name={match.teamB} 
                        size="md"
                      />
                      <span className="font-bold truncate text-sm text-white">
                        {censorText(match.teamB) || "TBD"}
                      </span>
                    </div>
                    <span className="font-mono font-black text-lg text-white">
                      {match.scoreB}
                    </span>
                  </div>

                  {/* Match Info */}
                  <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex justify-between items-center text-xs text-muted-foreground">
                    <span>Round {match.round} {match.group && `| Group ${match.group}`}</span>
                    <span className="capitalize">{match.status === "completed" ? "จบแล้ว" : match.status === "ongoing" ? "กำลังแข่ง" : "รอดำเนินการ"}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 border-dashed border-white/10 py-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">
              {!selectedTournament ? "กรุณาเลือกการแข่งขัน" : "ยังไม่มีแมตช์สำหรับการแข่งขันนี้"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
