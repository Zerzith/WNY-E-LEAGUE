import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <AlertTriangle className="w-24 h-24 text-destructive opacity-80" />
        </div>
        <h1 className="text-4xl font-display font-bold text-white">404 Page Not Found</h1>
        <p className="text-muted-foreground">
          ขออภัย ไม่พบหน้าที่คุณต้องการ อาจเป็นเพราะลิงก์ผิดหรือหน้าเพจถูกลบไปแล้ว
        </p>
        <Link href="/">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white w-full">
            กลับสู่หน้าหลัก
          </Button>
        </Link>
      </div>
    </div>
  );
}
