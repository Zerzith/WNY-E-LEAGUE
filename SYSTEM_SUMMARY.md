# สรุประบบสมัครสมาชิกและเข้าสู่ระบบ

## ภาพรวมโปรเจกต์
โปรเจกต์ **วิทยาลัยเทคนิควังน้ำเย็น Esports Management System** เป็นระบบจัดการการแข่งขัน Esports สำหรับวิทยาลัยเทคนิค

## เทคโนโลยีที่ใช้
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI Components
- **Routing**: Wouter (React Router alternative)
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **State Management**: React Query (@tanstack/react-query)
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form + Zod Validation

## ระบบ Authentication ที่มีอยู่แล้ว

### 1. หน้า Login/Register (`/client/src/pages/Login.tsx`)

**ฟีเจอร์ที่มี:**
- ✅ สลับระหว่างโหมด Login และ Register
- ✅ ฟอร์มเข้าสู่ระบบด้วย Email + Password
- ✅ ฟอร์มสมัครสมาชิกพร้อมฟิลด์:
  - ชื่อ-นามสกุล (displayName)
  - รหัสบัตรนักศึกษา (studentId)
  - อีเมล (email)
  - รหัสผ่าน (password)
- ✅ บันทึกข้อมูลผู้ใช้ใน Firestore collection "users"
- ✅ แสดง Loading State ขณะประมวลผล
- ✅ แสดง Toast Notification เมื่อสำเร็จหรือเกิดข้อผิดพลาด
- ✅ Redirect ไปหน้าแรกหลัง Login สำเร็จ

**ข้อมูลที่บันทึกใน Firestore:**
```typescript
{
  displayName: string,
  studentId: string,
  role: "user" | "admin",
  email: string,
  createdAt: ISO timestamp
}
```

### 2. Authentication Hook (`/client/src/hooks/use-auth.tsx`)

**ฟีเจอร์:**
- ✅ AuthContext สำหรับจัดการ state ผู้ใช้ทั้งแอป
- ✅ ตรวจสอบสถานะการเข้าสู่ระบบด้วย `onAuthStateChanged`
- ✅ ดึงข้อมูล role จาก Firestore เพื่อใช้ในการควบคุมสิทธิ์
- ✅ ฟังก์ชัน `signOut()` สำหรับออกจากระบบ
- ✅ Loading State ขณะตรวจสอบ Authentication

**การใช้งาน:**
```typescript
const { user, loading, signOut } = useAuth();
// user มี properties: uid, email, displayName, role
```

### 3. Firebase Configuration (`/client/src/lib/firebase.ts`)

**ฟีเจอร์:**
- ✅ Initialize Firebase App
- ✅ Export `auth` และ `db` สำหรับใช้งานทั่วทั้งแอป
- ✅ ฟังก์ชัน `mapFirebaseErrorToThaiMessage()` แปลง Error Code เป็นภาษาไทย

**Error Messages ที่รองรับ:**
- `auth/user-not-found` → "ไม่พบผู้ใช้นี้ในระบบ"
- `auth/wrong-password` → "รหัสผ่านไม่ถูกต้อง"
- `auth/email-already-in-use` → "อีเมลนี้ถูกใช้งานแล้ว"
- `auth/weak-password` → "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"
- `auth/invalid-email` → "รูปแบบอีเมลไม่ถูกต้อง"
- `auth/network-request-failed` → "การเชื่อมต่ออินเทอร์เน็ตมีปัญหา"

### 4. Database Schema (`/shared/schema.ts`)

**Users Table:**
```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  studentId: text("student_id"),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  photoUrl: text("photo_url"),
  role: text("role").default("user"), // 'admin' | 'user'
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Flow การทำงาน

### การสมัครสมาชิก (Register)
1. ผู้ใช้กรอกข้อมูล: ชื่อ-นามสกุล, รหัสนักศึกษา, อีเมล, รหัสผ่าน
2. เรียก `createUserWithEmailAndPassword(auth, email, password)`
3. อัปเดต Profile ด้วย `updateProfile(user, { displayName })`
4. บันทึกข้อมูลเพิ่มเติมใน Firestore collection "users"
5. แสดง Toast "สมัครสมาชิกสำเร็จ"
6. Redirect ไปหน้าแรก

### การเข้าสู่ระบบ (Login)
1. ผู้ใช้กรอก อีเมล และ รหัสผ่าน
2. เรียก `signInWithEmailAndPassword(auth, email, password)`
3. Firebase ตรวจสอบข้อมูล
4. AuthContext ดึง role จาก Firestore
5. แสดง Toast "เข้าสู่ระบบสำเร็จ"
6. Redirect ไปหน้าแรก

### การออกจากระบบ (Logout)
1. เรียก `signOut()` จาก useAuth hook
2. Firebase ล้าง session
3. Redirect ไปหน้า /login

## Protected Routes
ระบบใช้ `useAuth()` เพื่อตรวจสอบสิทธิ์การเข้าถึงหน้าต่างๆ:
- หน้าที่ต้อง Login: RegisterTeam, AdminDashboard, Chat
- หน้าที่ต้องเป็น Admin: AdminDashboard

## ตัวแปรสภาพแวดล้อมที่ต้องการ (.env)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

## สรุป
✅ **ระบบสมัครสมาชิกและเข้าสู่ระบบพร้อมใช้งานแล้ว**
✅ **มีการจัดการ Error และแสดงข้อความภาษาไทย**
✅ **มี Authentication Context สำหรับใช้ทั่วทั้งแอป**
✅ **มีการบันทึกข้อมูลผู้ใช้ใน Firestore**
✅ **รองรับ Role-based Access Control (user/admin)**

## หมายเหตุ
โปรเจกต์นี้ใช้ Firebase Authentication และ Firestore เป็นหลัก ไม่ได้ใช้ PostgreSQL/Drizzle ORM สำหรับ Authentication (แม้จะมี schema ไว้ แต่ comment ระบุว่าใช้ Firebase เป็นหลัก)
