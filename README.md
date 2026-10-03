# 🔥 Todaprime - What do I need to do today?

เว็บแอปพลิเคชันจัดการภารกิจและเตือนความจำประจำวันอัจฉริยะ พัฒนาด้วย **Angular 19 (Frontend)** และ **Golang (Backend)**

---

## 🌟 ฟีเจอร์ที่อัดแน่นครบทุกด้าน (All-in-one Productivity Suite)

1. **🔥 Prime Focus (Eat The Frog / ภารกิจหลักอันดับ 1)**
   - กำหนดงานที่สำคัญที่สุดของวันเพียง 1 ข้อที่ต้องทำให้เสร็จก่อนสิ่งอื่น
   - มีการแสดงผลเด่นชัดพร้อมแถบความก้าวหน้าของงานย่อย

2. **⏰ Smart Reminder & Alarm Engine (ระบบแจ้งเตือนอัจฉริยะ)**
   - ตรวจสอบเวลาทุก ๆ 10 วินาทีแบบ Real-time
   - เมื่อถึงเวลาที่ตั้งไว้ ระบบจะส่งเสียงกระดิ่งเตือน (Web Audio API สังเคราะห์เสียงคุณภาพสูง)
   - แสดงกล่องแจ้งเตือนสีแดงกระพริบด้านบน พร้อมปุ่มกดเริ่มโฟกัส 25 นาทีทันที
   - รองรับ Web Desktop Notifications

3. **⏱️ Pomodoro Focus Timer (ตัวจับเวลาสมาธิ)**
   - โหมดมาตรฐาน 25 นาที (โฟกัส), 5 นาที (พักสั้น), 15 นาที (พักยาว)
   - สามารถผูกเข้ากับงานที่กำลังทำ เพื่อบันทึกเวลาจริง (Actual Minutes) ลงระบบ

4. **🌱 Daily Habits Tracker & Streaks (ระบบสร้างนิสัย)**
   - เช็กชื่อนิสัยประจำวัน (เช่น ดื่มน้ำ 2 ลิตร, อ่านหนังสือ, ออกกำลังกาย)
   - นับจำนวนวันต่อเนื่อง (🔥 Streak Counter) เพื่อสร้างแรงจูงใจ

5. **🕒 Hourly Timeline View (ตารางเวลา 08:00 - 22:00)**
   - มุมมองตารางเวลาแบ่งตามชั่วโมง ช่วยให้เห็นภาพรวมทั้งวันว่าเวลาไหนต้องทำอะไร

6. **📝 Rich Subtasks Checklist (ขั้นตอนย่อย)**
   - แตกงานใหญ่เป็นข้อย่อย เช็กถูกทีละข้อพร้อมคำนวณ Progress Bar อัตโนมัติ

7. **⚡ Quick Add & Smart Filters**
   - แถบเพิ่มงานด่วน พิมพ์ชื่อแล้วกด `Enter` เพิ่มลงวันนี้ทันที
   - ค้นหาแบบ Real-time พร้อมตัวกรองตามสถานะ, หมวดหมู่ (Work, Personal, Health, ฯลฯ) และระดับความสำคัญ (Prime, High, Medium, Low)

8. **📊 Daily Progress & End of Day Review**
   - สรุปภาพรวมความสำเร็จประจำวัน (Completion Rate %)
   - โหมดสรุปผลงานตอนสิ้นวัน (End of Day Review)

9. **🌙 Dark / Light Theme & Responsive Design**
   - รองรับทั้งโหมดมืด (Dark Mode) และโหมดสว่าง (Light Mode)

---

## 📁 โครงสร้างโปรเจกต์

```text
D:\Todaprime in Project\
  ├── backend/                   # Golang REST API Server
  │    ├── database/db.go        # SQLite & TiDB/MySQL connection + Migrations
  │    ├── handlers/handlers.go  # API endpoints
  │    ├── models/models.go      # Data models
  │    ├── main.go               # HTTP server & static SPA server
  │    └── todaprime-server.exe  # Standalone compiled executable
  ├── frontend/                  # Angular 19 SPA
  │    ├── src/app/
  │    │    ├── services/        # TaskService & SoundService
  │    │    ├── models/          # TypeScript interfaces
  │    │    └── app.component.*  # Main Dashboard Component & Styles
  │    └── dist/                 # Production build assets
  ├── start-all.bat              # ดับเบิลคลิกเดียวเปิดทั้งระบบ
  ├── run-backend.bat            # เปิดเฉพาะ Backend (Go)
  └── run-frontend.bat           # เปิดเฉพาะ Frontend (Angular)
```

---

## 🚀 วิธีเปิดใช้งาน (ง่ายที่สุด)

### วิธีที่ 1: ดับเบิลคลิกไฟล์เดียว
ดับเบิลคลิกไฟล์ **`start-all.bat`** 
- ระบบจะเปิด Backend (Go ที่พอร์ต 8080)
- เปิด Frontend (Angular ที่พอร์ต 4200)
- และเปิดเว็บบราวเซอร์ให้อัตโนมัติที่ `http://localhost:4200`

---

### วิธีที่ 2: รันผ่าน Terminal / คำสั่ง

**1. รัน Backend (Go):**
```powershell
cd "D:\Todaprime in Project\backend"
go run main.go
# หรือรันไฟล์ exe โดยตรง:
.\todaprime-server.exe
```

**2. รัน Frontend (Angular):**
```powershell
cd "D:\Todaprime in Project\frontend"
npm start
```
เปิดบราวเซอร์ที่: `http://localhost:4200`

---

## 🗄️ การเชื่อมต่อฐานข้อมูล TiDB หรือ MySQL

ตามค่าเริ่มต้น ระบบจะใช้ **SQLite** (`todaprime.db`) ในเครื่องให้อัตโนมัติ (ไม่ต้องติดตั้งอะไรเพิ่ม พร้อมใช้ทันที)

หากต้องการเชื่อมต่อกับ **TiDB Cloud Serverless** หรือ **MySQL ภายนอก**:
เพียงตั้งค่า Environment Variable `DATABASE_URL` ก่อนรัน Backend เช่น:
```powershell
$env:DATABASE_URL = "username:password@tcp(gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000)/todaprime?tls=true"
go run main.go
```
ระบบจะเปลี่ยนไปใช้ฐานข้อมูล TiDB และสร้างตารางทั้งหมดให้อัตโนมัติทันทีครับ!
