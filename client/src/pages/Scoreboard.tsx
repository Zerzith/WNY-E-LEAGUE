import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ScoreCard } from "@/components/ScoreCard";
import { Loader2 } from "lucide-react";

interface Match {
  id: string;
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
    // Query Firestore "matches" collection
    const q = query(collection(db, "matches"), orderBy("status", "desc")); // Live matches first
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchData = snapshot.docs.map(doc => ({ 
        ...doc.data(),
        id: doc.id.toString() 
      } as any));
      setMatches(matchData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching matches:", error);
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

  if (matches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-white mb-2">ตารางคะแนน</h1>
          <p className="text-muted-foreground">ยังไม่มีการแข่งขัน</p>
        </div>
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
