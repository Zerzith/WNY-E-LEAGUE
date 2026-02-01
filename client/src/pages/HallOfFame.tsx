import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { type Team } from "@shared/schema";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HallOfFame() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch approved teams from Firestore
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

  if (teams.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-white mb-2">ทำเนียบทีมแข่ง</h1>
          <p className="text-muted-foreground">ยังไม่มีทีมที่อนุมัติ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold text-white mb-2">ทำเนียบทีมแข่ง</h1>
        <p className="text-muted-foreground">ทีมที่เข้าร่วมการแข่งขันทั้งหมด</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="bg-card border-white/10 overflow-hidden hover:border-primary/50 transition-colors group">
            <div className="h-24 bg-gradient-to-r from-secondary to-background relative">
              <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-xl bg-card border-2 border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Users className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
            </div>
            <CardContent className="pt-12">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{team.name}</h3>
                  <p className="text-sm text-muted-foreground">{team.game}</p>
                </div>
                <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded border border-green-500/20 uppercase">
                  {team.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-white/50">สมาชิกทีม: {team.members?.length || 0} คน</div>
	                <div className="flex -space-x-2">
	                   {team.members?.slice(0, 5).map((member: any, i: number) => {
	                     const name = typeof member === 'string' ? member : (member.name || member.gameName || "P");
	                     return (
	                       <div key={i} className="w-8 h-8 rounded-full bg-secondary border border-card flex items-center justify-center text-xs text-white" title={name}>
	                          {name.charAt(0).toUpperCase()}
	                       </div>
	                     );
	                   })}
	                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
