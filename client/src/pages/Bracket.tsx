import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Match {
  id: string;
  round: number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: "pending" | "ongoing" | "completed";
}

interface Tournament {
  id: string;
  title: string;
  game: string;
  status: string;
  matches?: Match[];
}

export default function Bracket() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tournaments
  useEffect(() => {
    const q = query(collection(db, "events"), where("status", "in", ["ongoing", "completed"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tournamentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as any));
      setTournaments(tournamentsData);
      if (tournamentsData.length > 0) {
        setSelectedTournament(tournamentsData[0]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch matches for selected tournament
  useEffect(() => {
    if (!selectedTournament) return;

    const q = query(
      collection(db, "matches"),
      where("tournamentId", "==", selectedTournament.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as any))
        .sort((a, b) => a.round - b.round);
      setMatches(matchesData);
    });

    return () => unsubscribe();
  }, [selectedTournament]);

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

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
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
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold text-white mb-2">สายการแข่งขัน</h1>
        <p className="text-muted-foreground">ติดตามเส้นทางสู่แชมป์</p>
      </div>

      {/* Tournament Selector */}
      {tournaments.length > 1 && (
        <div className="mb-8 flex gap-4 flex-wrap justify-center">
          {tournaments.map((tournament) => (
            <button
              key={tournament.id}
              onClick={() => setSelectedTournament(tournament)}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                selectedTournament?.id === tournament.id
                  ? "bg-primary text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {tournament.title}
            </button>
          ))}
        </div>
      )}

      {tournaments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">ยังไม่มีการแข่งขันที่กำลังดำเนินการ</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-8">
          <div className="min-w-max flex justify-center py-8 px-4">
            <div className="flex gap-8 lg:gap-12">
              {rounds.map((round, roundIndex) => (
                <div key={round} className="flex flex-col justify-around gap-4 lg:gap-8">
                  <div className="text-center mb-4">
                    <p className="text-sm font-bold text-accent uppercase tracking-wider">
                      {roundIndex === rounds.length - 1
                        ? "ชิงชนะเลิศ"
                        : roundIndex === rounds.length - 2
                        ? "รอบ 4 ทีม"
                        : `รอบที่ ${round}`}
                    </p>
                  </div>
                  {matchesByRound[round].map((match) => (
                    <BracketMatch key={match.id} match={match} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BracketMatch({ match }: { match: Match }) {
  const winnerA = match.scoreA > match.scoreB;
  const winnerB = match.scoreB > match.scoreA;
  const isCompleted = match.status === "completed";

  return (
    <Card
      className={`w-56 lg:w-64 bg-card/50 border-white/10 overflow-hidden transition ${
        isCompleted ? "border-accent shadow-[0_0_20px_rgba(14,165,233,0.3)]" : ""
      }`}
    >
      {/* Match Status */}
      <div className="px-3 py-2 bg-white/5 border-b border-white/5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {match.status === "pending"
            ? "รอการแข่งขัน"
            : match.status === "ongoing"
            ? "กำลังแข่งขัน"
            : "เสร็จสิ้น"}
        </p>
      </div>

      {/* Team A */}
      <div
        className={`flex justify-between p-3 border-b border-white/5 transition ${
          winnerA && isCompleted ? "bg-primary/20" : ""
        }`}
      >
        <span
          className={`font-bold truncate ${
            winnerA && isCompleted ? "text-white" : "text-muted-foreground"
          }`}
        >
          {match.teamA || "ทีม A"}
        </span>
        <span className="font-mono font-bold text-white">{match.scoreA}</span>
      </div>

      {/* Team B */}
      <div
        className={`flex justify-between p-3 transition ${
          winnerB && isCompleted ? "bg-primary/20" : ""
        }`}
      >
        <span
          className={`font-bold truncate ${
            winnerB && isCompleted ? "text-white" : "text-muted-foreground"
          }`}
        >
          {match.teamB || "ทีม B"}
        </span>
        <span className="font-mono font-bold text-white">{match.scoreB}</span>
      </div>
    </Card>
  );
}
