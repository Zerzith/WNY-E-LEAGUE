import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Target, Shield } from "lucide-react";

export default function About() {
  const stats = [
    { label: "การแข่งขัน", value: "10+", icon: Trophy },
    { label: "นักกีฬา", value: "200+", icon: Users },
    { label: "เป้าหมาย", value: "Pro", icon: Target },
    { label: "ความปลอดภัย", value: "100%", icon: Shield },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">เกี่ยวกับเรา</h1>
          <p className="text-xl text-muted-foreground">WNY Esports - วิทยาลัยเทคนิควังน้ำเย็น</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-card/50 border-white/10 text-center p-6">
              <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </Card>
          ))}
        </div>

        <div className="space-y-12 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">วิสัยทัศน์ของเรา</h2>
            <p>
              WNY Esports ก่อตั้งขึ้นโดยมีวัตถุประสงค์เพื่อส่งเสริมและพัฒนาทักษะด้านอีสปอร์ตให้กับนักเรียนนักศึกษาในวิทยาลัยเทคนิควังน้ำเย็น 
              เราเชื่อว่าอีสปอร์ตไม่ใช่เพียงแค่การเล่นเกม แต่เป็นกีฬาที่ต้องใช้ทักษะการวางแผน การทำงานเป็นทีม และระเบียบวินัย 
              เพื่อก้าวสู่ความเป็นมืออาชีพในอุตสาหกรรมดิจิทัลในอนาคต
            </p>
          </section>

          <section className="bg-primary/5 border-l-4 border-primary p-8 rounded-r-xl">
            <h2 className="text-2xl font-bold text-white mb-4">พันธกิจ</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>สร้างพื้นที่สร้างสรรค์สำหรับนักกีฬาอีสปอร์ตในวิทยาลัย</li>
              <li>จัดการแข่งขันที่ได้มาตรฐานและยุติธรรม</li>
              <li>ส่งเสริมการใช้เวลาว่างให้เกิดประโยชน์และสร้างรายได้จากทักษะเกม</li>
              <li>เชื่อมโยงเครือข่ายอีสปอร์ตระหว่างสถาบันการศึกษา</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">ประวัติความเป็นมา</h2>
            <p>
              เริ่มต้นจากกลุ่มนักศึกษาที่หลงใหลในการแข่งขันเกม สู่การเป็นชมรมอีสปอร์ตอย่างเป็นทางการของวิทยาลัยเทคนิควังน้ำเย็น 
              เราได้รับความสนับสนุนจากทางวิทยาลัยในการจัดตั้งระบบการแข่งขันและแพลตฟอร์มออนไลน์นี้ขึ้นมา 
              เพื่อเป็นศูนย์กลางในการรวบรวมข้อมูลทีม ผลการแข่งขัน และข่าวสารต่างๆ ในวงการอีสปอร์ตของพวกเรา
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
