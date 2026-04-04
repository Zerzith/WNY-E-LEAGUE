# WNY E-League Management System - TODO

## Core Features
- [x] ตั้งค่า Firebase Admin SDK ด้วยไฟล์ credentials
- [x] ตรวจสอบและแก้ไขข้อมูลสมาชิกทีมให้ครบถ้วน (name, gameName, grade, department, studentId, phone, email)
- [x] แก้ไข EventDetail.tsx ให้แสดงข้อมูลครบถ้วน
- [x] แก้ไข Admin Dashboard ให้แสดงข้อมูลครบถ้วน
- [x] เพิ่มระบบจัดการแมตช์สำหรับทีมที่อนุมัติแล้ว
- [ ] เพิ่มการจัดการ error/loading states ให้ครบทุกส่วน
- [ ] ทดสอบระบบทั้งหมด

## Match Management Features
- [ ] สร้างหน้า Match Management สำหรับทีมที่ได้รับอนุมัติแล้ว
- [ ] ให้ทีมสามารถเลือก/ยืนยัน match ที่ได้รับมอบหมาย
- [ ] แสดง match schedule ให้ทีมเห็น
- [ ] ให้ทีมสามารถอัปเดต match result
- [ ] แสดง match history ของทีม
- [ ] เพิ่มส่วนจัดการแมตช์ใน Admin Dashboard ให้ครบถ้วน

## Error Handling & Loading States
- [ ] เพิ่ม error handling สำหรับ Firebase operations
- [ ] เพิ่ม loading states ในทุกหน้าที่เชื่อมต่อ Firebase
- [ ] เพิ่ม error messages ที่เป็นประโยชน์ต่อผู้ใช้
- [ ] เพิ่ม retry mechanisms สำหรับ failed operations

## Testing & Deployment
- [ ] ทดสอบระบบลงทะเบียนทีม
- [ ] ทดสอบระบบ Admin Dashboard
- [ ] ทดสอบระบบจัดการแมตช์
- [ ] ทดสอบการแสดงข้อมูลสมาชิกในทุกหน้า
- [ ] ทดสอบ Firebase integration
- [ ] Push โค้ดขึ้น GitHub

## Bug Fixes
- [x] แก้ไขการดึงทีมที่อนุมัติใน Admin Dashboard - dropdown ทีม A, B ไม่แสดงทีมให้เลือก
- [x] ให้ dropdown แสดงทีมทั้งหมดที่ได้รับการอนุมัติสำหรับการแข่งขันนี้น ๆ

## New Requests
- [x] ลบเบอร์โทรและอีเมลออกจากการแสดงข้อมูลสมาชิกทีม
- [x] เพิ่มปุ่มลบทีมใน Admin Dashboard
- [x] ลบทีมออกจากทุก collection เมื่อกดลบ (registrations, teams, matches)


## Bug Fixes - ครั้งที่ 2
- [x] แก้ไขชื่อทีมเป็น ID แทนชื่อจริง
- [x] แก้ไขโลโก้ไม่ขึ้นในสายการแข่งขันนี้และจัดการแมตช์
- [x] แก้ไข gameMode เป็น N/A แทนข้อมูลจริง
- [x] ตรวจสอบการดึงข้อมูลแมตช์ในหน้า Match Management


## New Requests - ครั้งที่ 3
- [x] ทำให้ระบบแสดงข้อมูลเหมือนกับ "test" event
- [x] ตรวจสอบ EventDetail - แสดงทีมและสมาชิกครบถ้วน
- [x] ตรวจสอบ Admin Dashboard - แสดงแมตช์ครบถ้วน
- [x] ตรวจสอบการแสดงโลโก้ของสมาชิกในทุกหน้า
- [x] ตรวจสอบการแสดงสถานะของสมาชิก (แฟน/ผู้เล่น)
