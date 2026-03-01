import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarCustom } from "@/components/ui/avatar-custom";
import { Loader2, Trophy, Users, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface TeamMember {
  name: string;
  gameName: string;
  grade: string;
  department: string;
  isSubstitute?: boolean;
}

interface Team {
  id: string;
  name: string;
  game: string;
  logoUrl?: string;
  members: TeamMember[];
  status: string;
}

export default function HallOfFame() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "teams"), where("status", "==", "approved"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as any));
      setTeams(teamData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching teams:", error);
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-wider">ทำเนียบทีม</h1>
        <p className="text-muted-foreground">รายชื่อทีมที่ผ่านการคัดเลือกและเข้าร่วมการแข่งขัน</p>
      </motion.div>

      {teams.length === 0 ? (
        <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-white/10">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">ยังไม่มีทีมที่ได้รับการอนุมัติในขณะนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card/50 border-white/10 overflow-hidden hover:border-primary/50 transition-all group">
                <div className="h-2 bg-primary w-full" />
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <AvatarCustom src={team.logoUrl} name={team.name} size="lg" className="ring-2 ring-primary/20" />
                  <div>
                    <CardTitle className="text-xl text-white group-hover:text-primary transition-colors">{team.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                        {team.game}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase">
                        <ShieldCheck className="w-3 h-3" /> Approved
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Users className="w-3 h-3" /> สมาชิกในทีม
                    </h4>
                    <div className="space-y-2">
                      {team.members && team.members.map((member, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <AvatarCustom name={member.name} size="xs" />
                            <div>
                              <div className="text-sm font-medium text-white leading-none">{member.name}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">{member.gameName}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-accent font-bold uppercase">{member.department}</div>
                            {member.isSubstitute && (
                              <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1 rounded ml-1">SUB</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
