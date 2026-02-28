import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ScoreCard } from "@/components/ScoreCard";
import { Loader2 } from "lucide-react";

interface Match {
  id: string;
  eventId: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  game: string;
  status: string;
  round: string;
  winner?: string;
  bannerUrl?: string;
  logoUrlA?: string;
  logoUrlB?: string;
}

export default function Scoreboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query Firestore "matches" collection
    const q = query(collection(db, "matches"), orderBy("status", "desc")); // Live matches first
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const matchData = await Promise.all(snapshot.docs.map(async (doc) => {
        const match = { 
          ...doc.data(),
          id: doc.id.toString() 
        } as any;

        // Fetch event bannerUrl for each match
        if (match.eventId) {
          const eventDoc = await getDoc(doc(db, "events", match.eventId));
          if (eventDoc.exists) {
            match.bannerUrl = (eventDoc.data() as any).bannerUrl;
          }
        }
        return match;
      }));
      
      // Fetch team logos for each match
      const matchesWithLogos = await Promise.all(
        matchData.map(async (match) => {
          try {
            // Fetch registrations for both teams
            const teamADoc = await getDoc(doc(db, "teams", match.teamA));
            const teamBDoc = await getDoc(doc(db, "teams", match.teamB));

            const teamAData = teamADoc.exists() ? teamADoc.data() : null;
            const teamBData = teamBDoc.exists() ? teamBDoc.data() : null;

            return {
              ...match,
              teamAName: teamAData?.name || "N/A",
              teamBName: teamBData?.name || "N/A",
              logoUrlA: teamAData?.logoUrl || undefined,
              logoUrlB: teamBData?.logoUrl || undefined,
            };
          } catch (error) {
            console.error("Error fetching logos for match:", match.id, error);
            return match;
          }
        })
      );
      
      setMatches(matchesWithLogos);
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
