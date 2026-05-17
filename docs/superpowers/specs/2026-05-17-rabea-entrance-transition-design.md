# تصميم: انتقال "تسجيل الدخول ← صفحة ربيع الترحيبية" مثل إنجاز (المرحلة 1‑ج)

**التاريخ:** 2026-05-17
**يبني على:** المرحلة 1‑ب (صفحة ربيع المستقلة `/operations-welcome`). هذا التصميم يضيف انتقالًا متحركًا للدخول مطابقًا لتتابع إنجاز.

---

## 0. القرارات المعتمدة (من العصف)

1. **التسلسل الكامل** مثل إنجاز: صفحة الدخول تضبّب/تتلاشى (`animate-login-blur-out`) + كنس ذهبي/حجاب يعبر الشاشة + صفحة ربيع تنكشف (`animate-welcome-reveal`).
2. **المقاربة (أ):** مزوّد دخول جديد مخصّص `RabeaEntranceTransition.tsx`، يُركّب فوق Routes كي تبقى طبقة الكنس ظاهرة أثناء التنقّل (نفس سبب وضع مزوّد إنجاز فوق Routes).
3. `LoginTransition.tsx` (إنجاز) و backend: **صفر مساس**. `RabeaWelcomeTransition.tsx` القديم يبقى **كود ميت** كما هو (قرار سابق).
4. مطابقة سلوك إنجاز حرفيًّا: لا يُضاف تقييد `prefers-reduced-motion` (إنجاز لا يقيّد هذه الأنيميشن — وفاءً لِـ "مثل إنجاز").

---

## 1. النطاق

### داخل النطاق
- مزوّد انتقال دخول جديد لربيع + طبقة الكنس الذهبي/الحجاب.
- ربط فرع REB9 في `LoginPage` بالمزوّد بدل التنقّل الفوري + تضبيب صفحة الدخول لطور ربيع.
- تركيب المزوّد في `App.tsx` فوق Routes.
- انكشاف صفحة `OperationsWelcomePage` عند التحميل.
- تحديث/إضافة الاختبارات.

### خارج النطاق
- أي backend / تعديل `LoginTransition.tsx` / حذف الكود الميت / تغيير محتوى صفحة ربيع نفسها.
- مرحلة "hold/exit" (صفحة ربيع هي الوجهة النهائية ولها زرها الخاص → `/operations`).

---

## 2. المعمارية

### 2.1 ملف جديد: `frontend/src/rabea/RabeaEntranceTransition.tsx`
- `export type RabeaEntrancePhase = "idle" | "sweep";`
- سياق React بقيمة افتراضية `{ phase: "idle", start: () => {} }`؛ `export function useRabeaEntrance(): { phase: RabeaEntrancePhase; start: () => void }`.
- `export function RabeaEntranceTransitionProvider({ children }: { children: ReactNode })`:
  - `const ENTER_MS = 1000;` (مطابق `ENTER_MS` في إنجاز).
  - حالة `phase`؛ `useNavigate()`؛ `useRef<number[]>` للمؤقّتات؛ `clearTimers()`؛ `useEffect(() => () => clearTimers(), [])`.
  - `start()`: إذا `phase !== "idle"` يُرجع؛ وإلا `setPhase("sweep")`، ويُجدول مؤقّت بعد `ENTER_MS`: `navigate("/operations-welcome", { replace: true }); setPhase("idle");`.
  - يُرجِع `<Ctx.Provider value={{ phase, start }}>{children}{phase === "sweep" ? <RabeaGoldSweepOverlay /> : null}</Ctx.Provider>`.
- `RabeaGoldSweepOverlay` (داخلي، **نسخ بصري متعمّد** من GoldSweepOverlay في إنجاز — لا استيراد من `LoginTransition.tsx`): `div` ثابت `pointer-events-none fixed inset-0 z-[110] overflow-hidden` يحوي:
  - خلفية خضراء داكنة ثابتة: `absolute inset-0 bg-gradient-to-b from-[#0a2818] via-[#0d3a24] to-[#14502f]` (تظهر بينما صفحة الدخول تتلاشى، قبل انكشاف الصفحة الجديدة).
  - حجاب: `absolute inset-0 animate-veil-sweep will-change-transform` بـ `style.background = "linear-gradient(270deg, rgba(13,58,36,0) 0%, rgba(13,58,36,0.18) 60%, rgba(10,40,24,0.35) 100%)"`.
  - ثلاثة خطوط ذهبية `GoldLine`: top `28%` thickness `0.5px` opacity `0.28`؛ top `50%` thickness `1px` opacity `0.45`؛ top `72%` thickness `0.5px` opacity `0.28`. كل خط: `absolute -end-[40%] w-[60%] animate-gold-sweep will-change-transform` مع `style` (top/height/opacity + التدرّج الذهبي + drop-shadow) **مطابق حرفيًّا** لِـ GoldLine في إنجاز.

> ملاحظة: الخلفية الخضراء داخل الطبقة ضرورية (إنجاز لا يحتاجها لأن لوحة الترحيب نفسها خلفية خضراء؛ هنا الصفحة الجديدة تُركَّب بعد التنقّل، فالطبقة توفّر الخلفية أثناء طور `sweep`).

### 2.2 `App.tsx` (إضافي + commit-hygiene)
استيراد `RabeaEntranceTransitionProvider` وتغليف Routes به داخل `LoginTransitionProvider` (نفس موضع مزوّد ربيع القديم سابقًا):
```
<LoginTransitionProvider>
<RabeaEntranceTransitionProvider>
<Routes> … </Routes>
</RabeaEntranceTransitionProvider>
</LoginTransitionProvider>
```
`App.tsx` يحمل هَنك إجازات سابق غير مرتبط ⇒ نفس فصل الـ commit المتّبع (لا يدخل commit ربيع).

### 2.3 `LoginPage.tsx` (إضافي/جراحي + commit-hygiene)
- استيراد `useRabeaEntrance` من `../rabea/RabeaEntranceTransition`.
- في الجسم: `const { phase: rabeaPhase, start: startRabeaEntrance } = useRabeaEntrance();`
- فرع REB9 يصبح:
  ```
  if (username === RABEA_USERNAME && password === RABEA_PASSWORD) {
    setRabeaMode(true);
    startRabeaEntrance();
    return;
  }
  ```
  (يُحذف `navigate("/operations-welcome", { replace: true })` من هذا الفرع — المزوّد ينقل.)
- **حسم:** في `LoginPage.tsx` الحالي `navigate` مُستخدَم **حصريًّا** داخل فرع REB9 (مسار إنجاز يستخدم `start()`، وإعادة التوجيه تستخدم مكوّن `<Navigate>` لا `useNavigate`). لذا بعد هذا التغيير يصبح `navigate` يتيمًا قطعًا ⇒ يُزال `useNavigate` من سطر الاستيراد (`import { Navigate } from "react-router-dom";`) ويُحذف سطر `const navigate = useNavigate();` (تنظيف اليتيم الذي أحدثه تغييري — لا كود ميت).
- توسيع `pageSlideClass` ليشمل طور ربيع:
  ```
  const pageSlideClass =
    phase === "enter" || rabeaPhase === "sweep"
      ? "animate-login-blur-out"
      : phase === "hold" || phase === "exit"
        ? "opacity-0"
        : "";
  ```
  (مسار إنجاز — منطق `phase` — يبقى كما هو حرفيًّا؛ تُضاف فقط حالة `rabeaPhase === "sweep"`.)
- `LoginPage.tsx` يحمل هَنك تخطيط سابق غير مرتبط (`flex flex-col items-start text-start`) ⇒ نفس فصل الـ commit.

> تحقّق `useNavigate`: بعد إزالة `navigate(...)` من فرع REB9، إن لم يبقَ أي استخدام لـ `navigate` في `LoginPage.tsx` فيُزال `useNavigate` من الاستيراد و`const navigate = useNavigate();` (تنظيف اليتيم الذي أحدثه تغييري). يُتحقَّق فعليًّا أثناء التنفيذ ويُثبَّت في الخطة.

### 2.4 `OperationsWelcomePage.tsx`
إضافة `animate-welcome-reveal will-change-transform` إلى قائمة أصناف جذر `<main>` الحالي (لا تغيير آخر) فتنكشف الصفحة (opacity 0→1، scale 1.015→1، blur 6→0، 700ms) عند التحميل.

---

## 3. التتابع الزمني

| اللحظة | الحدث |
|---|---|
| t=0 | دخول REB9 → `setRabeaMode(true)` + `startRabeaEntrance()` → الطور `sweep` |
| t=0 → ~600ms | `LoginPage` يطبّق `animate-login-blur-out` (تضبيب/تصغير/تلاشٍ) فوق طبقة الكنس |
| t=0 → ~1000ms | الطبقة: خلفية خضراء + `animate-veil-sweep` + ثلاثة خطوط `animate-gold-sweep` تعبر الشاشة |
| t≈1000ms | المزوّد ينفّذ `navigate("/operations-welcome", {replace})` ثم `setPhase("idle")` (تُفكّ الطبقة، تُركّب الصفحة) |
| t≈1000 → ~1700ms | `OperationsWelcomePage` تنكشف بـ `animate-welcome-reveal` (blur→scale→fade-in) فتغطي أي درز لحظي |

ENTER_MS=1000 مطابق لإنجاز؛ والانكشاف يوفّر الاستمرارية البصرية (نفس نمط إنجاز: التنقّل أثناء تحرّك الترحيب).

---

## 4. الاختبار

- **`frontend/src/rabea/__tests__/RabeaEntranceTransition.test.tsx` (جديد):** يُغلَّف بـ `MemoryRouter` + `Routes`: مسار يستضيف مكوّنًا يستدعي `start()` عبر `useRabeaEntrance`، ومسار `/operations-welcome` ببديل نصّي. باستخدام `vi.useFakeTimers()`: بعد `start()` تظهر طبقة الكنس (تأكيد عبر عنصر مميِّز، مثل `role`/نص نائب أو سمة)؛ بعد `vi.advanceTimersByTime(1000)` يتم التنقّل (يظهر بديل `/operations-welcome`) وتعود الطبقة `idle`. تنظيف `useRealTimers` في `afterEach`.
- **`frontend/src/rabea/__tests__/rabeaLogin.test.tsx` (تحديث):** REB9 يضغط دخول → (fake timers) طبقة الكنس تظهر؛ بعد `advanceTimersByTime(1000)` تظهر «ربيع ٩.» و«حالة التكميل اليومي»، و`/api/auth/login` **لا يُستدعى**. مستخدم غير REB9 → مسار إنجاز/الـ backend كما هو، و«ربيع ٩.» غير موجودة. (يُستخدم `vi.useFakeTimers()` لأن التنقّل مؤجَّل بـ setTimeout؛ مع userEvent يُستخدم `advanceTimers`/`runOnlyPendingTimers` بحذر، أو userEvent بإعداد `advanceTimers`.)
- **اختبارات المكوّنات الأخرى:** `OperationsWelcomePage.test.tsx` يبقى أخضر (صنف الانكشاف على `<main>` لا يكسر التأكيدات).
- **حارس انحدار:** `git log main..HEAD -- frontend/src/components/LoginTransition.tsx` فارغ؛ كل اختبارات ربيع خضراء؛ صفر أخطاء tsc/lint في `rabea/`+`LoginPage`+`App.tsx`؛ commits ربيع تحتوي فقط هَنكاتها (هَنكا الإجازات/التخطيط السابقان يبقيان غير مُلتزمين).

---

## 5. الملفات

### جديدة
- `frontend/src/rabea/RabeaEntranceTransition.tsx`
- `frontend/src/rabea/__tests__/RabeaEntranceTransition.test.tsx`

### معدّلة (إضافي/جراحي)
- `frontend/src/pages/LoginPage.tsx` — استيراد + قراءة المزوّد + فرع REB9 + `pageSlideClass` + إزالة `useNavigate`/`const navigate` (صار يتيمًا قطعًا). commit: هَنكات ربيع فقط.
- `frontend/src/App.tsx` — تركيب `RabeaEntranceTransitionProvider`. commit: هَنكات ربيع فقط.
- `frontend/src/rabea/OperationsWelcomePage.tsx` — صنف الانكشاف على `<main>`.
- `frontend/src/rabea/__tests__/rabeaLogin.test.tsx` — التدفّق الجديد (fake timers).

### غير ممسوسة
- `frontend/src/components/LoginTransition.tsx` (إنجاز) — صفر تعديل (يُتحقَّق عبر `git diff main...HEAD`).
- `frontend/src/rabea/RabeaWelcomeTransition.tsx` — يبقى كود ميت كما هو.
- أي backend / DB.
