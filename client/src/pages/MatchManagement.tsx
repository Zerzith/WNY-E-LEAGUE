import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Swords, Calendar, Trophy, Users, Check, X, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface Match {
  id: string;
  eventId: string;
  eventTitle?: string;
  round: number;
  group: string;
  teamA: string;
  teamB: string;
  teamAName?: string;
  teamBName?: string;
  scoreA: number;
  scoreB: number;
  status: "pending" | "ongoing" | "completed";
  createdAt: any;
  winsA?: number;
  lossesA?: number;
  drawsA?: number;
  winsB?: number;
  lossesB?: number;
  drawsB?: number;
}

interface ApprovedTeam {
  id: string;
  teamName: string;
  game: string;
}

export default function MatchManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [approvedTeams, setApprovedTeams] = useState<ApprovedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Fetch approved teams for current user
  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    const q = query(
      collection(db, "teams"),
      where("userId", "==", user.uid),
      where("status", "==", "approved")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teams = snapshot.docs.map(doc => ({
        id: doc.id,
        teamName: doc.data().teamName || doc.data().name,
        game: doc.data().game,
      }));
      setApprovedTeams(teams);
      setLoading(false);

      // Auto-select first team if available
      if (teams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teams[0].id);
      }
    });

    return () => unsubscribe();
  }, [user, setLocation, selectedTeamId]);

  // Fetch matches for selected team
  useEffect(() => {
    if (!selectedTeamId) return;

    setLoadingMatches(true);

    const q = query(
      collection(db, "matches"),
      where("teamA", "in", [selectedTeamId]),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let matchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Match[];

      // Also get matches where team is teamB
      const q2 = query(
        collection(db, "matches"),
        where("teamB", "in", [selectedTeamId]),
      );

      const snapshot2 = await getDocs(q2);
      const matchesData2 = snapshot2.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Match[];

      matchesData = [...matchesData, ...matchesData2];

      // Fetch team names and event titles
      const enrichedMatches = await Promise.all(
        matchesData.map(async (match) => {
          let teamAName = match.teamA;
          let teamBName = match.teamB;
          let eventTitle = "";

          // Fetch team A name
          try {
            const teamADoc = await getDocs(
              query(collection(db, "teams"), where("id", "==", match.teamA))
            );
            if (teamADoc.docs.length > 0) {
              teamAName = teamADoc.docs[0].data().teamName || teamADoc.docs[0].data().name;
            }
          } catch (error) {
            console.error("Error fetching team A:", error);
          }

          // Fetch team B name
          try {
            const teamBDoc = await getDocs(
              query(collection(db, "teams"), where("id", "==", match.teamB))
            );
            if (teamBDoc.docs.length > 0) {
              teamBName = teamBDoc.docs[0].data().teamName || teamBDoc.docs[0].data().name;
            }
          } catch (error) {
            console.error("Error fetching team B:", error);
          }

          // Fetch event title
          try {
            const eventDoc = await getDocs(
              query(collection(db, "events"), where("id", "==", match.eventId))
            );
            if (eventDoc.docs.length > 0) {
              eventTitle = eventDoc.docs[0].data().title;
            }
          } catch (error) {
            console.error("Error fetching event:", error);
          }

          return {
            ...match,
            teamAName,
            teamBName,
            eventTitle,
          };
        })
      );

      setMatches(enrichedMatches);
      setLoadingMatches(false);
    });

    return () => unsubscribe();
  }, [selectedTeamId]);

  const handleConfirmMatch = async (matchId: string) => {
    try {
      await updateDoc(doc(db, "matches", matchId), {
        status: "ongoing",
      });
      toast({ title: "ยืนยันแมตช์เรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการยืนยันแมตช์", variant: "destructive" });
    }
  };

  const handleCompleteMatch = async (matchId: string) => {
    try {
      await updateDoc(doc(db, "matches", matchId), {
        status: "completed",
      });
      toast({ title: "จบแมตช์เรียบร้อย" });
    } catch (error) {
      toast({ title: "ผิดพลาดในการจบแมตช์", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (approvedTeams.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24">
        <Button
          onClick={() => setLocation("/")}
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับไปหน้าแรก
        </Button>
        <Card className="bg-card/50 border-white/10 text-center py-12">
          <Swords className="w-20 h-20 mx-auto text-white/20 mb-4" />
          <h3 className="text-xl font-bold text-white/40 mb-2">ยังไม่มีทีมที่ได้รับการอนุมัติ</h3>
          <p className="text-muted-foreground">กรุณารอให้ Admin อนุมัติทีมของคุณก่อน</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Button
        onClick={() => setLocation("/")}
        variant="ghost"
        className="mb-6 text-muted-foreground hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        กลับไปหน้าแรก
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-white mb-4 flex items-center gap-3">
          <Swords className="w-8 h-8 text-primary" />
          จัดการแมตช์
        </h1>
        <p className="text-muted-foreground">ดูและจัดการแมตช์ของทีมของคุณ</p>
      </div>

      {/* Team Selection */}
      <Card className="bg-card/50 border-white/10 p-6 rounded-3xl mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          เลือกทีม
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvedTeams.map((team) => (
            <motion.button
              key={team.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedTeamId(team.id)}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                selectedTeamId === team.id
                  ? "border-primary bg-primary/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <p className="font-bold text-white">{team.teamName}</p>
              <p className="text-sm text-muted-foreground">{team.game}</p>
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Matches List */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          แมตช์ของทีม
        </h3>

        {loadingMatches ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">กำลังโหลดแมตช์...</p>
          </div>
        ) : matches.length === 0 ? (
          <Card className="bg-card/50 border-white/10 text-center py-12">
            <Swords className="w-20 h-20 mx-auto text-white/20 mb-4" />
            <h3 className="text-xl font-bold text-white/40 mb-2">ยังไม่มีแมตช์</h3>
            <p className="text-muted-foreground">Admin จะสร้างแมตช์สำหรับทีมของคุณ</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/50 border-white/10 overflow-hidden hover:border-primary/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{match.eventTitle}</CardTitle>
                        <CardDescription>
                          รอบ {match.round} {match.group && `- กลุ่ม ${match.group}`}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          match.status === "pending"
                            ? "outline"
                            : match.status === "ongoing"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {match.status === "pending"
                          ? "รอดำเนินการ"
                          : match.status === "ongoing"
                          ? "กำลังดำเนินการ"
                          : "เสร็จสิ้น"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <p className="font-bold text-white text-lg">{match.teamAName}</p>
                        <p className="text-2xl font-bold text-primary mt-2">{match.scoreA}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <p className="text-muted-foreground font-bold">VS</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-white text-lg">{match.teamBName}</p>
                        <p className="text-2xl font-bold text-primary mt-2">{match.scoreB}</p>
                      </div>
                    </div>

                    {/* RoV specific stats */}
                    {match.winsA !== undefined && (
                      <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">ชนะ: {match.winsA}</p>
                          <p className="text-muted-foreground">แพ้: {match.lossesA}</p>
                          <p className="text-muted-foreground">เสมา: {match.drawsA}</p>
                        </div>
                        <div></div>
                        <div className="text-center">
                          <p className="text-muted-foreground">ชนะ: {match.winsB}</p>
                          <p className="text-muted-foreground">แพ้: {match.lossesB}</p>
                          <p className="text-muted-foreground">เสมา: {match.drawsB}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {match.status === "pending" && (
                        <Button
                          onClick={() => handleConfirmMatch(match.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          ยืนยันแมตช์
                        </Button>
                      )}
                      {match.status === "ongoing" && (
                        <Button
                          onClick={() => handleCompleteMatch(match.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          จบแมตช์
                        </Button>
                      )}
                      {match.status === "completed" && (
                        <Button disabled className="flex-1">
                          <Check className="w-4 h-4 mr-2" />
                          เสร็จสิ้น
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
