# ระบบสมัครสมาชิกและเข้าสู่ระบบ
## วิทยาลัยเทคนิควังน้ำเย็น Esports Management System

---

## 🎯 สรุปสั้น

โปรเจกต์นี้**มีระบบสมัครสมาชิกและเข้าสู่ระบบที่สมบูรณ์แล้ว** ไม่จำเป็นต้องเพิ่มอะไร

---

## ✅ ฟีเจอร์ที่มีอยู่

### 1. หน้า Login/Register (`/login`)
- ✅ ฟอร์มเข้าสู่ระบบ (Email + Password)
- ✅ ฟอร์มสมัครสมาชิก (ชื่อ-นามสกุล, รหัสนักศึกษา, อีเมล, รหัสผ่าน)
- ✅ สลับระหว่างโหมด Login/Register
- ✅ แสดง Loading State
- ✅ แสดง Error Message ภาษาไทย
- ✅ Redirect หลัง Login สำเร็จ

### 2. Authentication System
- ✅ Firebase Authentication
- ✅ Firestore Database
- ✅ AuthContext (React Context API)
- ✅ Protected Routes
- ✅ Role-based Access Control (user/admin)

### 3. UI/UX
- ✅ Responsive Design
- ✅ Gaming/Esports Theme
- ✅ Animations (Framer Motion)
- ✅ Toast Notifications
- ✅ ภาษาไทยทั้งหมด

---

## 📁 ไฟล์สำคัญ

```
client/src/
├── pages/Login.tsx           # หน้า Login/Register
├── hooks/use-auth.tsx        # Authentication Hook
├── lib/firebase.ts           # Firebase Config
└── components/Navigation.tsx # แสดงสถานะ Login
```

---

## 🚀 วิธีใช้งาน

### 1. ติดตั้ง Dependencies
```bash
pnpm install
```

### 2. ตั้งค่า Firebase
สร้างไฟล์ `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. รันโปรเจกต์
```bash
pnpm dev
```

### 4. ทดสอบระบบ
1. เปิด `http://localhost:5173`
2. คลิก "เข้าสู่ระบบ"
3. คลิก "ยังไม่มีบัญชี? สมัครสมาชิก"
4. กรอกข้อมูลและทดสอบ

---

## 🔐 การทำงาน

### สมัครสมาชิก
```
กรอกฟอร์ม → Firebase Auth → อัปเดต Profile → บันทึก Firestore → Login อัตโนมัติ
```

### เข้าสู่ระบบ
```
Email + Password → Firebase Auth → ดึง role จาก Firestore → อัปเดต Context → เข้าสู่ระบบ
```

### ออกจากระบบ
```
คลิก Logout → Firebase signOut → ล้าง Context → Redirect /login
```

---

## 📊 ข้อมูลที่เก็บ

### Firestore Collection: `users`
```typescript
{
  displayName: "นายสมชาย ใจดี",
  studentId: "6XXXXXXXXX",
  role: "user",
  email: "example@email.com",
  createdAt: "2026-01-27T14:30:00.000Z"
}
```

---

## 🛡️ Security

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📝 Error Messages (ภาษาไทย)

| Error Code | ข้อความ |
|------------|---------|
| `auth/user-not-found` | ไม่พบผู้ใช้นี้ในระบบ |
| `auth/wrong-password` | รหัสผ่านไม่ถูกต้อง |
| `auth/email-already-in-use` | อีเมลนี้ถูกใช้งานแล้ว |
| `auth/weak-password` | รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร |
| `auth/invalid-email` | รูปแบบอีเมลไม่ถูกต้อง |
| `auth/network-request-failed` | การเชื่อมต่ออินเทอร์เน็ตมีปัญหา |

---

## 🎨 UI Components

### ใช้ Shadcn/ui + Radix UI
- Button
- Input
- Label
- Card
- Toast
- Dialog
- Form

---

## 🔧 การปรับแต่ง

### เพิ่มฟิลด์ในฟอร์ม
แก้ไข `client/src/pages/Login.tsx`:
```typescript
const [newField, setNewField] = useState("");

// เพิ่มใน JSX
<Input value={newField} onChange={(e) => setNewField(e.target.value)} />

// เพิ่มใน Firestore
await setDoc(doc(db, "users", uid), {
  ...existingData,
  newField
});
```

### เปลี่ยนสี Theme
แก้ไข `tailwind.config.ts`:
```typescript
colors: {
  primary: '#004080',
  accent: '#FF6B35',
}
```

---

## 📚 เอกสารเพิ่มเติม

- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) - คู่มือละเอียด
- [SYSTEM_SUMMARY.md](./SYSTEM_SUMMARY.md) - สรุประบบ

---

## ✨ สรุป

**ระบบสมัครสมาชิกและเข้าสู่ระบบพร้อมใช้งาน 100%**

ไม่จำเป็นต้องเพิ่มโค้ดใดๆ เพียงแค่:
1. ตั้งค่า Firebase Configuration
2. รันโปรเจกต์
3. ทดสอบการใช้งาน

---

**พัฒนาโดย:** วิทยาลัยเทคนิควังน้ำเย็น  
**วันที่:** 27 มกราคม 2026
