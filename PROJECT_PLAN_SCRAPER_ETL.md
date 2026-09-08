# Automated Scraper + ETL Pipeline

## เป้าหมายโปรเจค

ปิด gap สุดท้ายที่ 4 โปรเจคก่อนหน้ายังไม่ได้โชว์: **เขียน code scraping เอง** จากเว็บที่ไม่มี
official API ให้ใช้ ตรงกับ JD ที่ระบุว่า "หรือเขียน Code Scraping เอง" ตรงตัว

### Story ที่ต้องการสื่อ
4 โปรเจคก่อนหน้าใช้ official API/dataset ทั้งหมด (YouTube, NewsAPI, Kaggle, pytrends) โปรเจคนี้
โชว์ว่าถ้าวันหนึ่ง platform ที่ต้องใช้จริง (เช่น social listening tool บางตัว) ไม่มี API ให้ ก็ยัง
เขียน pipeline ดึงข้อมูลเองได้ พร้อมเข้าใจเรื่อง data ethics/ToS ด้วย

---

## เลือกเป้าหมาย (Target Selection) — ต้องทำอย่างมีความรับผิดชอบ

**แนะนำ: Wikipedia** — เนื้อหาเปิดให้ reuse ตามสัญญาอนุญาต CC-BY-SA ชัดเจน ปลอดภัยด้าน ToS
มากที่สุด แนะนำ scrape ตารางที่เกี่ยวกับ content/creator trend เช่น "List of most-subscribed
YouTube channels" (เชื่อมกับโปรเจค KOL scoring model ก่อนหน้าได้ด้วย — ใช้เป็นข้อมูลอ้างอิง
cross-check)

**ทางเลือกอื่น:** Government open-data portal ที่มีข้อมูลเป็นตาราง HTML ล้วน ยังไม่มี CSV/API
ให้โหลด

**ห้าม scrape:** เว็บพาณิชย์ที่ระบุห้าม scraping ชัดเจนใน ToS (LinkedIn, JobsDB, Indeed
ส่วนใหญ่ห้าม) — ความเสี่ยงทางกฎหมายไม่คุ้มกับ portfolio project

- [ ] เลือก target website ที่จะ scrape
- [ ] **เช็ค `robots.txt` ของเว็บนั้นก่อนเริ่ม** (เช่น เปิด `[เว็บ]/robots.txt` ดูว่า path ที่จะ
      scrape ถูกห้ามไหม)
- [ ] อ่าน Terms of Service คร่าว ๆ เพื่อยืนยันว่าไม่ขัดกับนโยบายเว็บ

---

## Tech Stack

- **Scraping:** Python, `requests`, `BeautifulSoup4` (เริ่มจาก static HTML ก่อน — Wikipedia
  ไม่ต้องใช้ Selenium)
- **Storage:** `SQLite` (เทคนิคใหม่ที่ยังไม่เคยใช้ในโปรเจคก่อนหน้า — เหมาะกับข้อมูลที่มีโครงสร้าง
  ชัดเจนและจะ query ต่อ)
- **Automation:** GitHub Actions (scheduled scraping)
- **Frontend:** Next.js + Tailwind + Recharts
- **Deployment:** GitHub → Vercel

---

## Scraper Engineering Checklist (จุดที่ทำให้โปรเจคนี้ดูมืออาชีพ)

- [ ] ตั้ง `User-Agent` header ที่ระบุตัวตนชัดเจน (ไม่ปลอมเป็น browser จริงเพื่อหลบเลี่ยงการตรวจจับ)
- [ ] ใส่ `time.sleep()` หน่วงระหว่าง request แต่ละครั้ง (rate limiting ด้วยตัวเอง ไม่ยิงรัว ๆ)
- [ ] ทำ error handling: try/except รอบทุก request, retry with exponential backoff ถ้า request
      ล้มเหลว
- [ ] เขียน parser ให้ทนทานต่อการเปลี่ยนแปลงโครงสร้างหน้าเว็บบ้าง (เช่น เช็คว่า element ที่หาเจอ
      ไหมก่อนดึงค่า ไม่ crash ถ้าโครงสร้างเปลี่ยนเล็กน้อย)
- [ ] Cache raw HTML ที่ดึงมาไว้ก่อน (กันกรณีต้อง parse ใหม่โดยไม่ต้องยิง request ซ้ำ)

---

## ETL Pipeline

### Extract
- [ ] เขียน `scraper/extract.py` — ดึงหน้า HTML ตาม checklist ด้านบน เก็บ raw HTML ไว้ใน
      `data/raw_html/`

### Transform
- [ ] เขียน `scraper/transform.py` — parse HTML ด้วย BeautifulSoup, clean text (ตัด whitespace,
      แปลง HTML entity), แปลง string ตัวเลขเป็น int/float, ตรวจ/ตัดข้อมูลซ้ำ

### Load
- [ ] เขียน `scraper/load.py` — insert ข้อมูลที่ clean แล้วเข้า SQLite (`data/scraped.db`)
      ออกแบบ schema ให้เหมาะกับการ query ภายหลัง (เช่น ตาราง `entries` พร้อม `scraped_at`
      timestamp เพื่อ track การเปลี่ยนแปลงข้ามเวลา)

---

## แผนพัฒนา (Phases)

### Phase 0 — Setup
- [ ] เลือก target website, เช็ค robots.txt/ToS
- [ ] Repo ใหม่: `npx create-next-app@latest scraper-etl-pipeline --tailwind --app`

### Phase 1 — Scraper Development
- [ ] เขียน extract → transform → load ตามลำดับ
- [ ] ทดสอบรันครั้งแรก ตรวจสอบว่าข้อมูลที่ได้ถูกต้องครบถ้วน

### Phase 2 — Automation
- [ ] ตั้ง GitHub Actions workflow ให้รัน scraper ตามตารางเวลา (เช่น ทุกวัน) commit ข้อมูลใหม่
      เข้า repo อัตโนมัติ

### Phase 3 — Dashboard (Next.js)
- [ ] อ่านข้อมูลจาก SQLite แสดงเป็นตาราง/chart
- [ ] (ถ้ามีข้อมูลสะสมหลายวัน) แสดง trend การเปลี่ยนแปลงของข้อมูลข้ามเวลา

### Phase 4 — Deploy
- [ ] Push GitHub, เชื่อม Vercel, ตั้งค่า env vars (ถ้ามี)

### Phase 5 — Polish
- [ ] README: อธิบาย scraping ethics ที่ทำตาม (robots.txt check, rate limiting, User-Agent)
      + ทำไมเลือก SQLite แทน JSON + "What this demonstrates"

---

## หมายเหตุสำหรับ Claude Code

เน้นคุณภาพของ Phase 1 (Scraper Development) เป็นพิเศษ — ให้ error handling และ rate limiting
ครบตาม checklist ก่อนไป Phase อื่น เพราะนี่คือส่วนที่จะถูกถามในสัมภาษณ์มากที่สุดว่า "ทำไมต้องทำแบบนี้"
