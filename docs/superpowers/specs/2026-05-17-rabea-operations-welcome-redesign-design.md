# تصميم: إعادة بناء صفحة ربيع الترحيبية من الهاندأوف (المرحلة 1‑ب)

**التاريخ:** 2026-05-17
**المصدر:** `design_handoff_welcome_page_rabe/` (README + welcome.html).
**يبني على:** spec المرحلة 1 `docs/superpowers/specs/2026-05-17-rabea-operations-welcome-design.md` ويستبدل واجهتها بصفحة قائمة مطابقة للهاندأوف.

---

## 0. القرارات المعتمدة (من جلسة العصف)

1. **صفحة مستقلة** على `/operations-welcome` تطابق الهاندأوف بدقة — تُلغى آلية Overlay الانتقالية (gold-sweep). `LoginTransition.tsx` يبقى غير ممسوس.
2. **تطابق بصري كامل (hi-fi)** مع إبقاء العناصر التي تشير لوظائف غير موجودة **بصرية/غير فعّالة**.
3. العنوان: «مرحباً بعودتك،» + بالتدرّج الذهبي «**ربيع ٩.**» (طلب المستخدم الأخير يتقدّم على نص الهاندأوف "ربيع").
4. **المقاربة (ب):** بناء الصفحة وإعادة التوصيل، مع **إبقاء** ملفّات Overlay القديمة دون حذف (كود ميت مُبقى بقرار المستخدم): `RabeaWelcomeTransition.tsx`, `TakmeelStatusCard.tsx`, `__tests__/TakmeelStatusCard.test.tsx`.
5. **تصحيح افتراض الخط:** المشروع **يحمّل أصلًا** IBM Plex Sans Arabic + Tajawal عبر رابط Google Fonts في `frontend/index.html`. لذا يُضاف **IBM Plex Mono** إلى نفس الرابط (متّسق مع النمط القائم ومطابق للهاندأوف) — بدل محاكاته.

---

## 1. النطاق

### داخل النطاق
- صفحة `OperationsWelcomePage` على `/operations-welcome` (محروسة بـ `isRabeaMode()`).
- إعادة توصيل دخول REB9 ليُوجّه للصفحة بدل تشغيل Overlay.
- توسيع `takmeelMock.ts` و`takmeelView.ts` (دالة نقية) للبيانات/الاشتقاقات الجديدة + اختباراتها.
- إضافة IBM Plex Mono + عائلة `mono` في Tailwind.

### خارج النطاق
- أي backend / migration / مسارات `/dashboard` أو `/centers` / drawer تنبيهات / إشعارات حقيقية.
- حذف الكود الميت (قرار المستخدم: يُبقى).
- لمس `LoginTransition.tsx` أو Injaz.

---

## 2. المعمارية والتوجيه

- **ملف جديد:** `frontend/src/rabea/OperationsWelcomePage.tsx` — تخطيط الصفحة + الحارس + مؤقّت تحديث ٦٠ث.
- **المسار:** في `App.tsx` يُضاف `<Route path="/operations-welcome" element={<OperationsWelcomePage />} />` خارج `ProtectedRoute` (بجانب `/operations`). الحارس داخل الصفحة: `if (!isRabeaMode()) return <Navigate to="/login" replace />;`.
- **`LoginPage.tsx`:** يُستبدل فرع REB9 الحالي:
  - يُحذف `import { useRabeaWelcome } ...` وسطر `const { start: startRabea } = useRabeaWelcome();`.
  - داخل `handleSubmit`، فرع REB9 يصير:
    ```
    if (username === RABEA_USERNAME && password === RABEA_PASSWORD) {
      setRabeaMode(true);
      navigate("/operations-welcome", { replace: true });
      return;
    }
    ```
    (`useNavigate` متوفّر أصلًا في `LoginPage`.)
- **`App.tsx`:** يُزال غلاف `<RabeaWelcomeTransitionProvider>` (والاستيرادان `RabeaWelcomeTransitionProvider`، `OperationsPlaceholderPage` يبقى)، ويُضاف استيراد + مسار `OperationsWelcomePage`.
- **كود ميت مُبقى:** `RabeaWelcomeTransition.tsx` (و`useRabeaWelcome`) لم يعد له مستهلِك؛ يبقى الملف كما هو دون استيراد (يُجزّأ من البناء بالـ tree-shaking). `TakmeelStatusCard.tsx` + اختباره يبقيان (الاختبار يظل أخضر مستقلًا).
- **نظافة الـ commits:** `App.tsx` و`LoginPage.tsx` فيهما تغييرات سابقة غير مرتبطة (إجازات/editorial). تُلتزم commits فيها **فقط** hunks ربيع، وتُعاد التغييرات السابقة لشجرة العمل غير مُلتزمة — نفس انضباط المرحلة 1. `index.html` و`tailwind.config.js` نظيفان (مطابقان لـ main) فلا يحتاجان فصلًا.

---

## 3. تفكيك المكوّنات (`frontend/src/rabea/`)

ملفات مركّزة (مسؤولية واحدة لكل ملف):

- `OperationsWelcomePage.tsx` — الصفحة: خلفية + `.page` grid (`auto 1fr auto`) + الحارس + `useEffect` تحديث `now` كل ٦٠ث + يجمع المكوّنات أدناه.
- `welcome/WelcomeTopBar.tsx` — brand (دائرة ذهبية بحرف "إ" نائبة + "نظام إنجاز"/"لوحة شعبة العمليات") + alert-pill (label + فاصل + نقطة نابضة + قيمة) + date-pill (أيقونة Calendar + تاريخ اليوم العربي) + زر الجرس (Bell + badge "٣").
- `welcome/WelcomeGreeting.tsx` — eyebrow ("INJAZ · OPERATIONS CENTER" بخطّين) + `<h1>` («مرحباً بعودتك،» / «ربيع ٩.» متدرّج ذهبي) + role chip (User + "مدير شعبة العمليات") + summary (الجملة المشتقّة، كلمات `<b>` ذهبية) + زرّان (أساسي ذهبي "الانتقال إلى لوحة التحكم" + شبحي "تكميل المراكز المعلّقة").
- `welcome/CompletionPanel.tsx` — البطاقة: head (Clipboard + "حالة التكميل اليومي" + sub + تاريخ يسار + "ينتهي خلال …") + `CountRing` + side stats + `CentersList`.
- `welcome/CountRing.tsx` — SVG ring (r=68، المحيط ≈ 427.26، track + progress بتدرّج `#46a96a→#d9c79a`، `rotate(-90deg)`، `role="img"` + `aria-label`)، الوسط: رقم كبير + «/ ٢» + caption.
- `welcome/CentersList.tsx` — header ("تفاصيل المراكز" + "إدارة المراكز ←") + صفوف (أيقونة Check/Hourglass + اسم/منطقة + sub المسؤول/التأخير + وقت/حالة).
- `welcome/WelcomeFooter.tsx` — "نظام إنجاز · شعبة العمليات · الإصدار 2.4.1".

الأيقونات من `lucide-react`: Clipboard, Calendar, User, Bell, Clock, Check, Hourglass (بديل Timer إن لزم), ArrowLeft, Building2.

---

## 4. البيانات والمنطق النقي

### `takmeelMock.ts` (توسيع)
```ts
export interface CenterTakmeel {
  id: string;          // "م22" (يُعرض بأرقام عربية عبر toArabicDigits)
  region: string;      // "جازان"
  responsible: string; // "عبدالله الزهراني"
  submittedAt: string | null; // "07:32" أو null
}
getTodayTakmeel(): [
  { id:"م22", region:"جازان", responsible:"عبدالله الزهراني", submittedAt:"07:32" },
  { id:"م23", region:"صبيا",  responsible:"سامي القرني",     submittedAt:null    },
]
```
(الحقول الموجودة `id`/`submittedAt` تبقى متوافقة؛ تُضاف `region`/`responsible`.)

### `takmeelView.ts` (توسيع — تبقى دالة نقية، `now` مُمرَّر)
`deriveTakmeelView(centers, now)` تُضيف على ناتجها الحالي:
- `ringFraction` = completed/total، `ringCircumference` = 427.26، `ringDash` = `${fraction*427.26} ${427.26}`.
- `percentLabel` = نسبة بأرقام عربية + "٪" (مثل "٥٠٪").
- `completedCount`, `pendingCount`.
- `summary`: كائن `{ kind, pendingCount, firstPendingName|null, firstPendingDelayLabel|null }` حيث `kind ∈ {allComplete, beforeDeadline, pendingAfterDeadline, empty}`. المكوّن يبني الجملة بثلاثة قوالب صريحة (لا غموض):
  - `allComplete`: «أكملت جميع المراكز تكميل اليوم — يمكنك الانتقال إلى لوحة التحكم.»
  - `beforeDeadline`: «لم يبدأ وقت رفع التكميل بعد (٩:٠٠ ص) — {pendingCount} مركز قيد الانتظار.»
  - `pendingAfterDeadline`: «لديك {pendingCount==1?"مركز واحد":"{pendingCount} مراكز"} لم يُكمل تكميل اليوم حتى الآن — {firstPendingName} متأخّر منذ {firstPendingDelayLabel}. ابدأ بمتابعته قبل الانتقال إلى لوحة التحكم.» (الكلمات بين {} تُغلَّف بـ `<b>` ذهبية).
  - `empty`: لا تُعرض جملة ملخّص (تظهر رسالة الحالة الفارغة في اللوحة بدلًا منها).
- لكل مركز إضافةً للحالي: `regionLabel`، `subText` (مكتمل: "تم التكميل في الموعد · المسؤول: {responsible}" / منتظر: "متأخر {delayLabel} · المسؤول: {responsible}")، `metaTime` (وقت بأرقام عربية أو "— —:—")، `metaSub` ("اليوم" / "غير مُسجّل").
يُعاد استخدام منطق العتبة (٩:٠٠) والتأخير والحالات (`empty/pending/none/partial/complete`) كما هو.

---

## 5. الوفاء البصري

- **التوكنز:** ألوان/ظلال/أنصاف أقطار الهاندأوف عبر Tailwind arbitrary values (`bg-[#061a10]`, `text-[#a9b8ad]`, `rounded-[22px]`, ظل اللوحة، توهّج الذهبي…). لا حاجة لتعديل `tailwind.config.js` للألوان (قيم مباشرة)، **عدا** إضافة عائلة الخط `mono`.
- **الخلفية:** `div` ثابت `inset-0` بتدرّجات الهاندأوف الراديالية + طبقة نقاط (`radial-gradient(... 1px) 18px 18px` مع mask إهليلجي) + vignette. (بدل `shape.webp` الخاص بـ Injaz.)
- **الخطوط:** في `frontend/index.html` يُضاف `&family=IBM+Plex+Mono:wght@400;500` إلى رابط Google Fonts القائم. في `tailwind.config.js` تُضاف `fontFamily.mono: ['"IBM Plex Mono"','ui-monospace','monospace']`. تُستخدم `font-mono` + `tabular-nums` للأرقام/الأوقات (`.mono`/`.num`). الأرقام تُعرض عربية شرقية عبر `toArabicDigits` الموجود.
- **التخطيط:** `.page` = grid `auto 1fr auto` padding `22px 28px`؛ `.stage` = grid `1.05fr 1fr` gap 32 max-width 1280 متوسّط، `align-items:center`.
- **متجاوب:** `<980px` → عمود واحد، ring 130؛ `<560px` → إخفاء البلز الوسطى، ring متوسّط. (Tailwind `max-[980px]:` / `max-[560px]:` أو breakpoints مخصّصة.)
- **الشعار** دائرة ذهبية نائبة بحرف "إ" (كما الهاندأوف) — قابل للاستبدال لاحقًا بشعار رسمي.

---

## 6. السلوك والحالات

- الزر الأساسي "الانتقال إلى لوحة التحكم" → `navigate("/operations")` (صفحة "قيد التطوير" الحالية).
- غير الفعّال (بصري فقط، لا تنقّل، لا تعطيل مرئي صارخ): الزر الشبحي "تكميل المراكز المعلّقة"، الجرس، "إدارة المراكز ←"، صفوف المراكز. مستوى الإنذار ثابت "عادي"، شارة الجرس "٣".
- **حالات تُنفَّذ:**
  - فارغ (لا مراكز): استبدال لوحة العدّ بقائمة بسيطة + رسالة "لم يتم تسجيل أي مراكز بعد" (بدون زر فعّال).
  - كل المراكز مكتملة: شارة خضراء كبيرة "✓ جميع المراكز أكملت اليوم" مكان قائمة المعلّقات (تبقى قائمة التفاصيل).
  - قبل ٩:٠٠: حالة pending — لا حكم تأخير (نفس قاعدة المرحلة 1).
- **افتراض:** لا skeleton ولا حالة خطأ تحميل (المصدر mock متزامن).
- تحديث كل ٦٠ث (إعادة حساب `now` فقط؛ التأخير/العدّاد حيّ بلا وميض).
- `prefers-reduced-motion`: تعطيل نبض نقطة الإنذار ودخول الـ ring؛ يبقى hover بسيطًا.
- a11y: `aria-label` للجرس وللـ ring؛ تباين النصوص الباهتة على الداكن؛ زر CTA قابل للتركيز مع focus ring واضح.

---

## 7. الاختبار وحارس الانحدار

- **اختبارات وحدة (Vitest)** موسّعة لـ `deriveTakmeelView`: تغطّي الحالي + `ringFraction/ringDash`, `percentLabel`, `completedCount/pendingCount`, `summary` (٠/١/كل المراكز معلّقة)، نصوص المركز (subText مكتمل/متأخر، metaTime/metaSub)، الحالة الفارغة.
- **اختبار مكوّن:** `OperationsWelcomePage` يعرض العنوان "ربيع ٩."، "حالة التكميل اليومي"، صفوف م٢٢/م٢٣، والحارس يحوّل لـ `/login` خارج وضع ربيع (نفس نمط اختبار `OperationsPlaceholderPage`).
- **تكامل:** تحديث `rabeaLogin.test.tsx` للتدفّق الجديد — REB9 → التوجيه إلى `/operations-welcome` وظهور التصميم (لا Overlay)؛ مستخدم آخر → مسار إنجاز/الـ backend بلا تغيير. (اختبار `TakmeelStatusCard.test.tsx` يبقى أخضر مستقلًا — كود ميت مُبقى.)
- **حارس انحدار:** `git log main..HEAD -- frontend/src/components/LoginTransition.tsx` فارغ؛ commits الفرع تمسّ فقط docs + `frontend/src/rabea/**` + hunks ربيع في `App.tsx`/`LoginPage.tsx` + `index.html` + `tailwind.config.js`؛ صفر أخطاء tsc في ملفات ربيع؛ كل اختبارات ربيع خضراء؛ الأخطاء/الفشل السابقة غير المرتبطة تبقى كما هي (ليست انحدارًا).

---

## 8. الملفات

### جديدة
- `frontend/src/rabea/OperationsWelcomePage.tsx`
- `frontend/src/rabea/welcome/WelcomeTopBar.tsx`
- `frontend/src/rabea/welcome/WelcomeGreeting.tsx`
- `frontend/src/rabea/welcome/CompletionPanel.tsx`
- `frontend/src/rabea/welcome/CountRing.tsx`
- `frontend/src/rabea/welcome/CentersList.tsx`
- `frontend/src/rabea/welcome/WelcomeFooter.tsx`
- `frontend/src/rabea/__tests__/OperationsWelcomePage.test.tsx`

### معدّلة (إضافي/جراحي)
- `frontend/src/rabea/takmeelMock.ts` — حقول `region`/`responsible`.
- `frontend/src/rabea/takmeelView.ts` — اشتقاقات جديدة.
- `frontend/src/rabea/__tests__/takmeelView.test.ts` — اختبارات موسّعة.
- `frontend/src/rabea/__tests__/rabeaLogin.test.tsx` — تدفّق التوجيه الجديد.
- `frontend/src/pages/LoginPage.tsx` — فرع REB9 يُوجّه للمسار (hunks ربيع فقط في الـ commit).
- `frontend/src/App.tsx` — إزالة Provider + إضافة المسار (hunks ربيع فقط في الـ commit).
- `frontend/index.html` — إضافة IBM Plex Mono للرابط القائم.
- `frontend/tailwind.config.js` — عائلة `mono`.

### غير ممسوسة / مُبقاة كما هي
- `frontend/src/components/LoginTransition.tsx` (Injaz) + أي backend/DB — صفر تعديل.
- `frontend/src/rabea/RabeaWelcomeTransition.tsx`, `frontend/src/rabea/TakmeelStatusCard.tsx`, `frontend/src/rabea/__tests__/TakmeelStatusCard.test.tsx` — كود ميت مُبقى بقرار المستخدم.
