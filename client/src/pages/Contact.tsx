import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Facebook, Globe } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">ติดต่อเรา</h1>
          <p className="text-xl text-muted-foreground">สอบถามข้อมูลเพิ่มเติมหรือแจ้งปัญหาการใช้งาน</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="bg-card/50 border-white/10 p-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-bold text-white">ที่อยู่</h3>
                  <p className="text-sm text-muted-foreground">วิทยาลัยเทคนิควังน้ำเย็น 666 ม.1 ต.วังน้ำเย็น อ.วังน้ำเย็น จ.สระแก้ว 27210</p>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 border-white/10 p-6">
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-bold text-white">เบอร์โทรศัพท์</h3>
                  <p className="text-sm text-muted-foreground">037-251-222</p>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 border-white/10 p-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-bold text-white">อีเมล</h3>
                  <p className="text-sm text-muted-foreground">admin@wny.ac.th</p>
                </div>
              </div>
            </Card>

            <div className="flex gap-4 pt-4">
              <a href="https://www.facebook.com/WNYTechnicalCollege" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="http://www.wny.ac.th" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card className="bg-card/50 border-white/10 p-8">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">ชื่อ-นามสกุล</label>
                    <Input placeholder="กรอกชื่อของคุณ" className="bg-background/50 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">อีเมล</label>
                    <Input type="email" placeholder="example@email.com" className="bg-background/50 border-white/10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">หัวข้อ</label>
                  <Input placeholder="เรื่องที่ต้องการติดต่อ" className="bg-background/50 border-white/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">ข้อความ</label>
                  <Textarea placeholder="รายละเอียดข้อความของคุณ..." className="bg-background/50 border-white/10 min-h-[150px]" />
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6">
                  ส่งข้อความ
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
