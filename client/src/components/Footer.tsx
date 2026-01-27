export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h3 className="font-display font-bold text-lg text-white">
              Wang Nam Yen <span className="text-primary">Technical College</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              ระบบจัดการการแข่งขันกีฬาอีสปอร์ตวิทยาลัยเทคนิควังน้ำเย็น
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-accent transition-colors">เกี่ยวกับเรา</a>
            <a href="#" className="hover:text-accent transition-colors">ติดต่อ</a>
            <a href="#" className="hover:text-accent transition-colors">นโยบายความเป็นส่วนตัว</a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/5 text-center text-xs text-muted-foreground/50">
          © 2024 WNY Esports. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
