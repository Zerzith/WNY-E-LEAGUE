import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Login() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [studentId, setStudentId] = useState("");

  if (user) {
    setLocation("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        
        // Save extra user info to Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          displayName,
          studentId,
          role: "user",
          email: userCredential.user.email,
          createdAt: new Date().toISOString()
        });

        toast({ title: "สมัครสมาชิกสำเร็จ" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "เข้าสู่ระบบสำเร็จ" });
      }
      setLocation("/");
    } catch (error: any) {
      toast({ 
        title: isRegister ? "สมัครสมาชิกไม่สำเร็จ" : "เข้าสู่ระบบไม่สำเร็จ", 
        description: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <Card className="w-full max-w-md bg-card border-white/10 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display text-white">
            {isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </CardTitle>
          <CardDescription>
            {isRegister ? "สร้างบัญชีใหม่เพื่อเข้าใช้งานระบบ" : "กรอกข้อมูลเพื่อเข้าสู่บัญชีของคุณ"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div className="space-y-2">
                  <Label>ชื่อ-นามสกุล</Label>
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="นายสมชาย ใจดี" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>รหัสบัตรนักศึกษา</Label>
                  <Input 
                    value={studentId} 
                    onChange={(e) => setStudentId(e.target.value)} 
                    placeholder="6XXXXXXXXX" 
                    required 
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="example@email.com" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>รหัสผ่าน</Label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
              />
            </div>
            <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isRegister ? (
                <><UserPlus className="w-4 h-4 mr-2" /> สมัครสมาชิก</>
              ) : (
                <><LogIn className="w-4 h-4 mr-2" /> เข้าสู่ระบบ</>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/5 pt-6">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-primary"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิก"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
