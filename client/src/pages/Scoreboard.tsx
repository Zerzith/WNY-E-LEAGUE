import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ScoreCard } from "@/components/ScoreCard";
import { Loader2 } from "lucide-react";

interface Match {
  id: number;
  eventId: number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  game: string;
  status: string;
  round: string;
  winner?: string;
  bannerUrl?: string;
}

export default function Scoreboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd query Firestore "matches" collection
    // For now, let's simulate a subscription or use a mock if Firestore is empty
    const q = query(collection(db, "matches"), orderBy("status", "desc")); // Live matches first
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // FALLBACK MOCK DATA if firestore is empty for demo purposes
      if (matchData.length === 0) {
        setMatches([
          { id: 1, eventId: 1, teamA: "IT Tiger", teamB: "Auto Mech", scoreA: 13, scoreB: 11, game: "Valorant", status: "finished", round: "Final", winner: "IT Tiger", bannerUrl: "/assets/valorant-banner.png" },
          { id: 2, eventId: 1, teamA: "Elec Power", teamB: "Business Com", scoreA: 1, scoreB: 0, game: "RoV", status: "live", round: "Semi-Final", bannerUrl: "/assets/rov-banner.png" },
          { id: 3, eventId: 1, teamA: "Civil Eng", teamB: "Accounting", scoreA: 0, scoreB: 0, game: "Valorant", status: "scheduled", round: "Semi-Final", bannerUrl: "/assets/valorant-banner.png" },
          { id: 4, eventId: 1, teamA: "FreeFire Team A", teamB: "FreeFire Team B", scoreA: 2, scoreB: 1, game: "Free Fire", status: "live", round: "Round 1", bannerUrl: "/assets/freefire-banner.png" },
        ]);
      } else {
        setMatches(matchData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold text-white mb-2">ตารางคะแนน</h1>
        <p className="text-muted-foreground">ผลการแข่งขันสดและย้อนหลัง</p>
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        {matches.map((match) => (
          <ScoreCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
