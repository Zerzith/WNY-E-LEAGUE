import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ScoreCard } from "@/components/ScoreCard";
import { Loader2, Trophy, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  teamAName?: string;
  teamBName?: string;
}

interface TeamStanding {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  matches: number;
}

export default function Scoreboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);

  // Fetch events
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setEvents(eventsData);
      if (eventsData.length > 0 && !selectedEvent) {
        setSelectedEvent(eventsData[0].id);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch matches and calculate standings
  useEffect(() => {
    if (!selectedEvent) return;

    const q = query(
      collection(db, "matches"),
      where("eventId", "==", selectedEvent),
      orderBy("status", "desc")
    );
    
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
      
      // Fetch team logos and names for each match
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
      
      // Calculate standings from matches
      const standingsMap = new Map<string, TeamStanding>();
      
      matchesWithLogos.forEach(match => {
        if (match.status === "completed" || match.status === "finished") {
          const teamA = match.teamAName || match.teamA;
          const teamB = match.teamBName || match.teamB;
          
          if (!standingsMap.has(teamA)) {
            standingsMap.set(teamA, {
              teamId: match.teamA,
              teamName: teamA,
              wins: 0,
              losses: 0,
              draws: 0,
              points: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              matches: 0
            });
          }
          if (!standingsMap.has(teamB)) {
            standingsMap.set(teamB, {
              teamId: match.teamB,
              teamName: teamB,
              wins: 0,
              losses: 0,
              draws: 0,
              points: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              matches: 0
            });
          }
          
          const standingA = standingsMap.get(teamA)!;
          const standingB = standingsMap.get(teamB)!;
          
          standingA.goalsFor += match.scoreA;
          standingA.goalsAgainst += match.scoreB;
          standingA.matches += 1;
          
          standingB.goalsFor += match.scoreB;
          standingB.goalsAgainst += match.scoreA;
          standingB.matches += 1;
          
          if (match.scoreA > match.scoreB) {
            standingA.wins += 1;
            standingA.points += 3;
            standingB.losses += 1;
          } else if (match.scoreB > match.scoreA) {
            standingB.wins += 1;
            standingB.points += 3;
            standingA.losses += 1;
          } else {
            standingA.draws += 1;
            standingA.points += 1;
            standingB.draws += 1;
            standingB.points += 1;
          }
          
          standingA.goalDifference = standingA.goalsFor - standingA.goalsAgainst;
          standingB.goalDifference = standingB.goalsFor - standingB.goalsAgainst;
        }
      });
      
      const standingsArray = Array.from(standingsMap.values())
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        });
      
      setStandings(standingsArray);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching matches:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedEvent]);

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-display font-bold text-white">ตารางคะแนน</h1>
        </div>
        <p className="text-muted-foreground">ผลการแข่งขันสดและย้อนหลัง</p>
      </div>

      {events.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedEvent === event.id
                    ? "bg-primary text-black"
                    : "bg-card/50 text-white hover:bg-card border border-white/10"
                }`}
              >
                {event.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 ? (
        <div className="text-center py-12 bg-card/20 rounded-3xl border border-dashed border-white/10">
          <p className="text-muted-foreground">ยังไม่มีการแข่งขัน</p>
        </div>
      ) : (
        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="standings">ตารางอันดับ</TabsTrigger>
            <TabsTrigger value="matches">ผลการแข่งขัน</TabsTrigger>
          </TabsList>

          <TabsContent value="standings" className="space-y-6">
            {standings.length > 0 ? (
              <Card className="bg-card/50 border-white/10 overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    ตารางอันดับทีม
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 font-semibold text-white/80">อันดับ</th>
                          <th className="text-left py-3 px-4 font-semibold text-white/80">ทีม</th>
                          <th className="text-center py-3 px-4 font-semibold text-white/80">แข่ง</th>
                          <th className="text-center py-3 px-4 font-semibold text-white/80">ชนะ</th>
                          <th className="text-center py-3 px-4 font-semibold text-white/80">เสมอ</th>
                          <th className="text-center py-3 px-4 font-semibold text-white/80">แพ้</th>
                          <th className="text-center py-3 px-4 font-semibold text-white/80">ประตู</th>
                          <th className="text-center py-3 px-4 font-semibold text-white/80">คะแนน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((standing, index) => (
                          <tr key={standing.teamId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-white font-bold">{index + 1}</td>
                            <td className="py-3 px-4 text-white font-semibold">{standing.teamName}</td>
                            <td className="text-center py-3 px-4 text-white/80">{standing.matches}</td>
                            <td className="text-center py-3 px-4 text-green-400 font-semibold">{standing.wins}</td>
                            <td className="text-center py-3 px-4 text-yellow-400 font-semibold">{standing.draws}</td>
                            <td className="text-center py-3 px-4 text-red-400 font-semibold">{standing.losses}</td>
                            <td className="text-center py-3 px-4 text-white/80">{standing.goalsFor}-{standing.goalsAgainst}</td>
                            <td className="text-center py-3 px-4 text-primary font-bold text-lg">{standing.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 bg-card/20 rounded-3xl border border-dashed border-white/10">
                <p className="text-muted-foreground">ยังไม่มีผลการแข่งขัน</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            {matches.length > 0 ? (
              <div className="space-y-6 max-w-4xl">
                {matches.map((match) => (
                  <ScoreCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card/20 rounded-3xl border border-dashed border-white/10">
                <p className="text-muted-foreground">ยังไม่มีการแข่งขัน</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
