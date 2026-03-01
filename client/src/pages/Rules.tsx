import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, AlertCircle, CheckCircle2, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { AvatarCustom } from "@/components/ui/avatar-custom";

interface Rule {
  id: string;
  title: string;
  content: string;
  category: string;
  order: number;
  createdAt?: any;
}

interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  eventId: string;
  status: string;
  members?: any[];
}

interface RuleCategory {
  name: string;
  rules: Rule[];
}

export default function Rules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [approvedTeams, setApprovedTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch rules
    const rulesQuery = query(collection(db, "rules"), orderBy("order", "asc"));
    const rulesUnsubscribe = onSnapshot(rulesQuery, (snapshot) => {
      const rulesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rule));
      setRules(rulesData);
    }, (error) => {
      console.error("Error fetching rules:", error);
    });

    // Fetch approved teams
    const teamsQuery = query(
      collection(db, "registrations"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );
    const teamsUnsubscribe = onSnapshot(teamsQuery, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.teamName,
          logoUrl: data.logoUrl,
          eventId: data.eventId,
          status: data.status,
          members: data.members || []
        } as Team;
      });
      setApprovedTeams(teamsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching teams:", error);
      setLoading(false);
    });

    return () => {
      rulesUnsubscribe();
      teamsUnsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Group rules by category
  const groupedRules = rules.reduce((acc, rule) => {
    const category = rule.category || "ทั่วไป";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(rule);
    return acc;
  }, {} as Record<string, Rule[]>);

  const categories = Object.keys(groupedRules).sort();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-display font-bold text-white">ธรรมเนียบและกฎการแข่งขัน</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          กรุณาอ่านและทำความเข้าใจกฎการแข่งขันทั้งหมด ก่อนเข้าร่วมการแข่งขัน WNY Esports Tournament
        </p>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="rules">กฎการแข่งขัน</TabsTrigger>
          <TabsTrigger value="approved">ผ่านคัดเลือกทีม</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          {rules.length === 0 ? (
            <div className="text-center py-12 bg-card/20 rounded-3xl border border-dashed border-white/10">
              <FileText className="w-16 h-16 mx-auto text-white/10 mb-4" />
              <p className="text-muted-foreground">ยังไม่มีกฎการแข่งขัน</p>
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map((category, categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: categoryIndex * 0.1 }}
                >
                  <div className="mb-4">
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                      <div className="w-1 h-8 bg-primary rounded-full" />
                      {category}
                    </h2>
                  </div>

                  <div className="space-y-4 ml-4">
                    {groupedRules[category].map((rule, ruleIndex) => (
                      <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: ruleIndex * 0.05 }}
                      >
                        <Card className="bg-card/50 border-white/10 hover:border-primary/30 transition-all">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                              {rule.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {rule.content}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Important Notice */}
          <div className="mt-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 flex gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-300 mb-2">ข้อสำคัญ</h3>
              <p className="text-yellow-200/80">
                ผู้เข้าร่วมการแข่งขันทั้งหมดต้องยอมรับและปฏิบัติตามกฎการแข่งขันทั้งหมด 
                หากมีการละเมิดกฎการแข่งขัน ผู้จัดการแข่งขันมีสิทธิในการตัดสินใจลงโทษหรือไล่ออกจากการแข่งขัน
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Approved Teams Tab */}
        <TabsContent value="approved" className="space-y-6">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-display font-bold text-white">ผ่านคัดเลือกทีม</h2>
            </div>
            <p className="text-muted-foreground">รายชื่อทีมที่ผ่านการคัดเลือกและเข้าร่วมการแข่งขัน</p>
          </div>

          {approvedTeams.length === 0 ? (
            <div className="text-center py-12 bg-card/20 rounded-3xl border border-dashed border-white/10">
              <Trophy className="w-16 h-16 mx-auto text-white/10 mb-4" />
              <p className="text-muted-foreground">ยังไม่มีทีมที่ผ่านการคัดเลือก</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedTeams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card/50 border-white/10 hover:border-primary/30 transition-all overflow-hidden h-full">
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-4">
                        {team.logoUrl && (
                          <AvatarCustom 
                            src={team.logoUrl} 
                            alt={team.name} 
                            className="w-16 h-16"
                          />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">ทีมที่ {index + 1}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-white/60 mb-2">สมาชิก</p>
                          <div className="space-y-2">
                            {team.members && team.members.length > 0 ? (
                              team.members.map((member, memberIndex) => (
                                <div key={memberIndex} className="text-xs p-2 rounded-md bg-background/50">
                                  <p><strong>ชื่อจริง:</strong> {member.name}</p>
                                  <p><strong>ชื่อเกม:</strong> {member.gameName}</p>
                                  <p><strong>รหัสนักเรียน:</strong> {member.studentId}</p>
                                  <p><strong>แผนก:</strong> {member.department}</p>
                                  <p><strong>ปี:</strong> {member.grade}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground">ไม่มีข้อมูลสมาชิก</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
