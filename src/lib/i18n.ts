// MemTrant — Self-contained i18n translation system
// Supports: English (en), Russian (ru), Georgian (ka), Arabic (ar), Hebrew (he)

export type Lang = 'en' | 'ru' | 'ka' | 'ar' | 'he';

export const LANGUAGES: { code: Lang; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺' },
  { code: 'ka', label: 'Georgian', nativeLabel: 'ქართული', flag: '🇬🇪' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦' },
  { code: 'he', label: 'Hebrew', nativeLabel: 'עברית', flag: '🇮🇱' },
];

export function isRTL(lang: Lang): boolean {
  return lang === 'ar' || lang === 'he';
}

// ─── Translation keys ──────────────────────────────────────────────────────────

export const translations: Record<string, Record<Lang, string>> = {
  // ── Landing ───────────────────────────────────────────────────────────────
  'landing.subtitle': {
    en: 'Transit Memory Server for AI Agent Teams',
    ru: 'Сервер общей памяти для команд ИИ-агентов',
    ka: 'ტრანზიტული მეხსიერების სერვერი აი-აგენტთა გუნდებისთვის',
    ar: 'خادم الذاكرة العابرة لفرق وكلاء الذكاء الاصطناعي',
    he: 'שרת זיכרון מעבר לצוותי סוכני AI',
  },
  'landing.description': {
    en: 'Shared memory, task coordination, and file storage — the backbone your agents need to collaborate effectively.',
    ru: 'Общая память, координация задач и хранение файлов — основа для эффективного сотрудничества ваших агентов.',
    ka: 'საერთო მეხსიერება, ამოცანების კოორდინაცია და ფაილების საცავი — ფუნდამენტი, რომელიც საჭიროა თქვენი აგენტების ეფექტური თანამშრომლობისთვის.',
    ar: 'ذاكرة مشتركة وتنسيق المهام وتخزين الملفات — العمود الفقري الذي يحتاجه وكلاؤك للتعاون بفعالية.',
    he: 'זיכרון משותף, תיאום משימות ואחסון קבצים — העמוד השדרה שהסוכנים שלך צריכים כדי לשתף פעולה ביעילות.',
  },
  'landing.getStarted': {
    en: 'Get Started',
    ru: 'Начать',
    ka: 'დაიწყეთ',
    ar: 'ابدأ الآن',
    he: 'התחל עכשיו',
  },
  'landing.signIn': {
    en: 'Sign In',
    ru: 'Войти',
    ka: 'შესვლა',
    ar: 'تسجيل الدخول',
    he: 'התחברות',
  },
  'landing.featureMemory': {
    en: 'Shared Memory',
    ru: 'Общая память',
    ka: 'საერთო მეხსიერება',
    ar: 'ذاكرة مشتركة',
    he: 'זיכרון משותף',
  },
  'landing.featureMemoryDesc': {
    en: 'File-based storage agents can read & write',
    ru: 'Файловое хранилище для чтения и записи агентами',
    ka: 'ფაილური საცავი, რომელიც აგენტებს შეუძლიათ წაიკითხონ და ჩაწერონ',
    ar: 'تخزين ملفي يمكن للوكلاء القراءة والكتابة فيه',
    he: 'אחסון מבוסס קבצים שהסוכנים יכולים לקרוא ולכתוב',
  },
  'landing.featureInstructions': {
    en: 'Instructions',
    ru: 'Инструкции',
    ka: 'ინსტრუქციები',
    ar: 'التعليمات',
    he: 'הוראות',
  },
  'landing.featureInstructionsDesc': {
    en: 'Create, assign, and track tasks',
    ru: 'Создание, назначение и отслеживание задач',
    ka: 'ამოცანების შექმნა, მინიჭება და კონტროლი',
    ar: 'إنشاء المهام وتعيينها ومتابعتها',
    he: 'יצירה, הקצאה ומעקב אחר משימות',
  },
  'landing.featureInvite': {
    en: 'Invite System',
    ru: 'Система приглашений',
    ka: 'მოწვევის სისტემა',
    ar: 'نظام الدعوات',
    he: 'מערכת הזמנות',
  },
  'landing.featureInviteDesc': {
    en: 'Add agents and humans to your team',
    ru: 'Добавляйте агентов и людей в свою команду',
    ka: 'დაამატეთ აგენტები და ადამიანები თქვენს გუნდში',
    ar: 'أضف وكلاء وبشرًا إلى فريقك',
    he: 'הוסף סוכנים ובני אדם לצוות שלך',
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  'auth.createAccount': {
    en: 'Create Account',
    ru: 'Создать аккаунт',
    ka: 'ანგარიშის შექმნა',
    ar: 'إنشاء حساب',
    he: 'יצירת חשבון',
  },
  'auth.signIn': {
    en: 'Sign In',
    ru: 'Войти',
    ka: 'შესვლა',
    ar: 'تسجيل الدخول',
    he: 'התחברות',
  },
  'auth.tagline': {
    en: 'MemTrant — Agent Team Memory Server',
    ru: 'MemTrant — Сервер памяти для команд агентов',
    ka: 'MemTrant — აგენტთა გუნდის მეხსიერების სერვერი',
    ar: 'MemTrant — خادم ذاكرة فرق الوكلاء',
    he: 'MemTrant — שרת זיכרון לצוותי סוכנים',
  },
  'auth.username': {
    en: 'Username',
    ru: 'Имя пользователя',
    ka: 'მომხმარებლის სახელი',
    ar: 'اسم المستخدم',
    he: 'שם משתמש',
  },
  'auth.usernamePlaceholder': {
    en: 'your-username',
    ru: 'ваше-имя-пользователя',
    ka: 'თქვენი-სახელი',
    ar: 'اسم-المستخدم',
    he: 'שם-המשתמש',
  },
  'auth.loginToken': {
    en: 'Login Token',
    ru: 'Токен входа',
    ka: 'შესვლის ტოკენი',
    ar: 'رمز تسجيل الدخول',
    he: 'אסימון כניסה',
  },
  'auth.autoGenerate': {
    en: 'Auto-Generate',
    ru: 'Автогенерация',
    ka: 'ავტომატურად შექმნა',
    ar: 'توليد تلقائي',
    he: 'יצירה אוטומטית',
  },
  'auth.customToken': {
    en: 'Custom Token',
    ru: 'Своё значение',
    ka: 'სხვა მნიშვნელობა',
    ar: 'رمز مخصص',
    he: 'ערך מותאם אישית',
  },
  'auth.customTokenPlaceholder': {
    en: 'Enter your custom login token (min 8 chars)',
    ru: 'Введите свой токен входа (мин. 8 символов)',
    ka: 'შეიყვანეთ თქვენი შესვლის ტოკენი (მინ. 8 სიმბოლო)',
    ar: 'أدخل رمز تسجيل الدخول المخصص (8 أحرف على الأقل)',
    he: 'הזן אסימון כניסה מותאם (לפחות 8 תווים)',
  },
  'auth.autoGenerateHint': {
    en: "A secure token will be generated for you. You'll see it after signup.",
    ru: 'Безопасный токен будет сгенерирован автоматически. Вы увидите его после регистрации.',
    ka: 'უსაფრთხოების ტოკენი ავტომატურად შეიქმნება. ის რეგისტრაციის შემდეგ გამოჩნდება.',
    ar: 'سيتم إنشاء رمز آمن لك. ستراه بعد التسجيل.',
    he: 'אסימון מאובטח ייווצר עבורך. תראה אותו לאחר ההרשמה.',
  },
  'auth.loginTokenPlaceholder': {
    en: 'Enter your login token',
    ru: 'Введите токен входа',
    ka: 'შეიყვანეთ შესვლის ტოკენი',
    ar: 'أدخل رمز تسجيل الدخول',
    he: 'הזן אסימון כניסה',
  },
  'auth.alreadyHaveAccount': {
    en: 'Already have an account?',
    ru: 'Уже есть аккаунт?',
    ka: 'უკვე გაქვთ ანგარიში?',
    ar: 'لديك حساب بالفعل؟',
    he: 'כבר יש לך חשבון?',
  },
  'auth.needAccount': {
    en: 'Need an account?',
    ru: 'Нужен аккаунт?',
    ka: 'გჭირდებათ ანგარიში?',
    ar: 'تحتاج إلى حساب؟',
    he: 'צריך חשבון?',
  },
  'auth.register': {
    en: 'Register',
    ru: 'Зарегистрироваться',
    ka: 'რეგისტრაცია',
    ar: 'تسجيل',
    he: 'הרשמה',
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  'dashboard.yourTeams': {
    en: 'Your Teams',
    ru: 'Ваши команды',
    ka: 'თქვენი გუნდები',
    ar: 'فرقك',
    he: 'הצוותים שלך',
  },
  'dashboard.newTeam': {
    en: '+ New Team',
    ru: '+ Новая команда',
    ka: '+ ახალი გუნდი',
    ar: '+ فريق جديد',
    he: '+ צוות חדש',
  },
  'dashboard.loadingTeams': {
    en: 'Loading teams...',
    ru: 'Загрузка команд...',
    ka: 'გუნდების ჩატვირთვა...',
    ar: 'جارٍ تحميل الفرق...',
    he: 'טוען צוותים...',
  },
  'dashboard.noTeams': {
    en: 'No teams yet. Create your first team to get started.',
    ru: 'Команд пока нет. Создайте свою первую команду.',
    ka: 'გუნდები არ არის. შექმენით პირველი გუნდი.',
    ar: 'لا توجد فرق بعد. أنشئ أول فريق للبدء.',
    he: 'אין צוותים עדיין. צור את הצוות הראשון שלך.',
  },
  'dashboard.noDescription': {
    en: 'No description',
    ru: 'Нет описания',
    ka: 'აღწერა არ არის',
    ar: 'لا يوجد وصف',
    he: 'אין תיאור',
  },
  'dashboard.logout': {
    en: 'Logout',
    ru: 'Выйти',
    ka: 'გასვლა',
    ar: 'تسجيل الخروج',
    he: 'התנתקות',
  },

  // ── Team detail ───────────────────────────────────────────────────────────
  'team.back': {
    en: '← Back',
    ru: '← Назад',
    ka: '← უკან',
    ar: '→ رجوع',
    he: '→ חזרה',
  },
  'team.token': {
    en: '🔑 Token',
    ru: '🔑 Токен',
    ka: '🔑 ტოკენი',
    ar: '🔑 الرمز',
    he: '🔑 אסימון',
  },
  'team.delete': {
    en: 'Delete',
    ru: 'Удалить',
    ka: 'წაშლა',
    ar: 'حذف',
    he: 'מחיקה',
  },
  'team.tabOverview': {
    en: 'Overview',
    ru: 'Обзор',
    ka: 'მიმოხილვა',
    ar: 'نظرة عامة',
    he: 'סקירה כללית',
  },
  'team.tabAgents': {
    en: 'Agents',
    ru: 'Агенты',
    ka: 'აგენტები',
    ar: 'الوكلاء',
    he: 'סוכנים',
  },
  'team.tabMemory': {
    en: 'Memory',
    ru: 'Память',
    ka: 'მეხსიერება',
    ar: 'الذاكرة',
    he: 'זיכרון',
  },
  'team.tabInstructions': {
    en: 'Instructions',
    ru: 'Инструкции',
    ka: 'ინსტრუქციები',
    ar: 'التعليمات',
    he: 'הוראות',
  },
  'team.tabInvites': {
    en: 'Invites',
    ru: 'Приглашения',
    ka: 'მოწვევები',
    ar: 'الدعوات',
    he: 'הזמנות',
  },
  'team.tabAPI': {
    en: 'API',
    ru: 'API',
    ka: 'API',
    ar: 'API',
    he: 'API',
  },
  'team.loading': {
    en: 'Loading...',
    ru: 'Загрузка...',
    ka: 'ჩატვირთვა...',
    ar: 'جارٍ التحميل...',
    he: 'טוען...',
  },
  'team.statAgents': {
    en: 'Agents',
    ru: 'Агенты',
    ka: 'აგენტები',
    ar: 'الوكلاء',
    he: 'סוכנים',
  },
  'team.statInstructions': {
    en: 'Instructions',
    ru: 'Инструкции',
    ka: 'ინსტრუქციები',
    ar: 'التعليمات',
    he: 'הוראות',
  },
  'team.statFiles': {
    en: 'Files',
    ru: 'Файлы',
    ka: 'ფაილები',
    ar: 'الملفات',
    he: 'קבצים',
  },
  'team.statStorage': {
    en: 'Storage',
    ru: 'Хранилище',
    ka: 'საცავი',
    ar: 'التخزين',
    he: 'אחסון',
  },
  'team.description': {
    en: 'Description',
    ru: 'Описание',
    ka: 'აღწერა',
    ar: 'الوصف',
    he: 'תיאור',
  },
  'team.noDescription': {
    en: 'No description set.',
    ru: 'Описание не задано.',
    ka: 'აღწერა არ არის დაყენებული.',
    ar: 'لم يتم تعيين وصف.',
    he: 'לא הוגדר תיאור.',
  },
  'team.teamLead': {
    en: 'Team Lead',
    ru: 'Руководитель',
    ka: 'გუნდის ლიდერი',
    ar: 'قائد الفريق',
    he: 'ראש הצוות',
  },
  'team.noLead': {
    en: 'No lead assigned.',
    ru: 'Руководитель не назначен.',
    ka: 'ლიდერი არ არის დანიშნული.',
    ar: 'لم يتم تعيين قائد.',
    he: 'לא הוקצה ראש צוות.',
  },
  'team.recentInstructions': {
    en: 'Recent Instructions',
    ru: 'Последние инструкции',
    ka: 'ბოლო ინსტრუქციები',
    ar: 'أحدث التعليمات',
    he: 'הוראות אחרונות',
  },
  'team.noInstructions': {
    en: 'No instructions yet.',
    ru: 'Инструкций пока нет.',
    ka: 'ინსტრუქციები ჯერ არ არის.',
    ar: 'لا توجد تعليمات بعد.',
    he: 'אין הוראות עדיין.',
  },
  'team.agents': {
    en: 'Agents',
    ru: 'Агенты',
    ka: 'აგენტები',
    ar: 'الوكلاء',
    he: 'סוכנים',
  },
  'team.addAgent': {
    en: '+ Add Agent',
    ru: '+ Добавить агента',
    ka: '+ აგენტის დამატება',
    ar: '+ إضافة وكيل',
    he: '+ הוסף סוכן',
  },
  'team.noAgents': {
    en: 'No agents yet.',
    ru: 'Агентов пока нет.',
    ka: 'აგენტები ჯერ არ არის.',
    ar: 'لا يوجد وكلاء بعد.',
    he: 'אין סוכנים עדיין.',
  },
  'team.roleWorker': {
    en: 'Worker',
    ru: 'Исполнитель',
    ka: 'შემსრულებელი',
    ar: 'منفّذ',
    he: 'עובד',
  },
  'team.roleObserver': {
    en: 'Observer',
    ru: 'Наблюдатель',
    ka: 'დამკვირვებელი',
    ar: 'مراقب',
    he: 'משקיף',
  },
  'team.roleLead': {
    en: 'Lead',
    ru: 'Руководитель',
    ka: 'ლიდერი',
    ar: 'قائد',
    he: 'ראש',
  },
  'team.remove': {
    en: 'Remove',
    ru: 'Удалить',
    ka: 'წაშლა',
    ar: 'إزالة',
    he: 'הסרה',
  },
  'team.path': {
    en: 'Path:',
    ru: 'Путь:',
    ka: 'ბილიკი:',
    ar: 'المسار:',
    he: 'נתיב:',
  },
  'team.root': {
    en: 'root',
    ru: 'корень',
    ka: 'ძირითადი',
    ar: 'الجذر',
    he: 'שורש',
  },
  'team.rootBtn': {
    en: 'Root',
    ru: 'Корень',
    ka: 'ძირითადი',
    ar: 'الجذر',
    he: 'שורש',
  },
  'team.memoryEmpty': {
    en: 'Memory is empty. Agents can write files here via API.',
    ru: 'Память пуста. Агенты могут записывать файлы через API.',
    ka: 'მეხსიერება ცარიელია. აგენტებს შეუძლიათ ფაილების ჩაწერა API-ს მეშვეობით.',
    ar: 'الذاكرة فارغة. يمكن للوكلاء كتابة الملفات هنا عبر API.',
    he: 'הזיכרון ריק. סוכנים יכולים לכתוב קבצים כאן דרך API.',
  },
  'team.close': {
    en: 'Close',
    ru: 'Закрыть',
    ka: 'დახურვა',
    ar: 'إغلاق',
    he: 'סגירה',
  },
  'team.newInstruction': {
    en: '+ New Instruction',
    ru: '+ Новая инструкция',
    ka: '+ ახალი ინსტრუქცია',
    ar: '+ تعليمة جديدة',
    he: '+ הוראה חדשה',
  },
  'team.unassigned': {
    en: 'Unassigned',
    ru: 'Не назначено',
    ka: 'მინიჭებული არ არის',
    ar: 'غير معيّن',
    he: 'לא הוקצה',
  },
  'team.inviteAgent': {
    en: '+ Invite Agent',
    ru: '+ Пригласить агента',
    ka: '+ აგენტის მოწვევა',
    ar: '+ دعوة وكيل',
    he: '+ הזמן סוכן',
  },
  'team.inviteHuman': {
    en: '+ Invite Human',
    ru: '+ Пригласить человека',
    ka: '+ ადამიანის მოწვევა',
    ar: '+ دعوة شخص',
    he: '+ הזמן אדם',
  },
  'team.noInvites': {
    en: 'No invites yet.',
    ru: 'Приглашений пока нет.',
    ka: 'მოწვევები ჯერ არ არის.',
    ar: 'لا توجد دعوات بعد.',
    he: 'אין הזמנות עדיין.',
  },
  'team.role': {
    en: 'Role',
    ru: 'Роль',
    ka: 'როლი',
    ar: 'الدور',
    he: 'תפקיד',
  },
  'team.expires': {
    en: 'Exp:',
    ru: 'Ист:',
    ka: 'ვადა:',
    ar: 'ينتهي:',
    he: 'תפוגה:',
  },
  'team.viewCredentials': {
    en: 'View Credentials',
    ru: 'Показать учётные данные',
    ka: 'ავტორიზაციის მონაცემები',
    ar: 'عرض بيانات الاعتماد',
    he: 'הצג פרטי כניסה',
  },
  'team.apiReference': {
    en: 'API Reference',
    ru: 'Справочник API',
    ka: 'API სახსრები',
    ar: 'مرجع API',
    he: 'תיעוד API',
  },
  'team.method': {
    en: 'Method',
    ru: 'Метод',
    ka: 'მეთოდი',
    ar: 'الطريقة',
    he: 'מתודה',
  },
  'team.endpoint': {
    en: 'Endpoint',
    ru: 'Эндпоинт',
    ka: 'ენდპოინტი',
    ar: 'المُسنَد',
    he: 'נקודת קצה',
  },
  'team.apiDescription': {
    en: 'Description',
    ru: 'Описание',
    ka: 'აღწერა',
    ar: 'الوصف',
    he: 'תיאור',
  },
  // API endpoint descriptions — kept in English for all languages (technical terms)
  'team.apiStore': {
    en: 'Store/update a file',
    ru: 'Store/update a file',
    ka: 'Store/update a file',
    ar: 'Store/update a file',
    he: 'Store/update a file',
  },
  'team.apiRead': {
    en: 'Read a file or browse directory',
    ru: 'Read a file or browse directory',
    ka: 'Read a file or browse directory',
    ar: 'Read a file or browse directory',
    he: 'Read a file or browse directory',
  },
  'team.apiDelete': {
    en: 'Delete a file',
    ru: 'Delete a file',
    ka: 'Delete a file',
    ar: 'Delete a file',
    he: 'Delete a file',
  },
  'team.apiCreateInst': {
    en: 'Create instruction',
    ru: 'Create instruction',
    ka: 'Create instruction',
    ar: 'Create instruction',
    he: 'Create instruction',
  },
  'team.apiListInst': {
    en: 'List instructions',
    ru: 'List instructions',
    ka: 'List instructions',
    ar: 'List instructions',
    he: 'List instructions',
  },
  'team.apiUpdateInst': {
    en: 'Update instruction',
    ru: 'Update instruction',
    ka: 'Update instruction',
    ar: 'Update instruction',
    he: 'Update instruction',
  },
  'team.apiListAgents': {
    en: 'List agents',
    ru: 'List agents',
    ka: 'List agents',
    ar: 'List agents',
    he: 'List agents',
  },
  'team.apiCreateInvite': {
    en: 'Create invite',
    ru: 'Create invite',
    ka: 'Create invite',
    ar: 'Create invite',
    he: 'Create invite',
  },
  'team.apiListInvites': {
    en: 'List invites',
    ru: 'List invites',
    ka: 'List invites',
    ar: 'List invites',
    he: 'List invites',
  },

  // ── Modals ────────────────────────────────────────────────────────────────
  'modal.accountCreated': {
    en: 'Account Created!',
    ru: 'Аккаунт создан!',
    ka: 'ანგარიში შეიქმნა!',
    ar: 'تم إنشاء الحساب!',
    he: 'החשבון נוצר!',
  },
  'modal.saveCredentials': {
    en: 'Save your credentials now. They will not be shown again.',
    ru: 'Сохраните свои учётные данные сейчас. Они больше не будут показаны.',
    ka: 'დააწყეთ ავტორიზაციის მონაცემების შენახვა. ისინი ხელმეორედ არ გამოჩნდება.',
    ar: 'احفظ بيانات الاعتماد الآن. لن تظهر مرة أخرى.',
    he: 'שמור את פרטי הכניסה עכשיו. הם לא יוצגו שוב.',
  },
  'modal.username': {
    en: 'Username',
    ru: 'Имя пользователя',
    ka: 'მომხმარებლის სახელი',
    ar: 'اسم المستخدم',
    he: 'שם משתמש',
  },
  'modal.loginToken': {
    en: 'Login Token',
    ru: 'Токен входа',
    ka: 'შესვლის ტოკენი',
    ar: 'رمز تسجيل الدخول',
    he: 'אסימון כניסה',
  },
  'modal.copyToClipboard': {
    en: 'Copy to Clipboard',
    ru: 'Копировать в буфер',
    ka: 'კოპირება ბუფერში',
    ar: 'نسخ إلى الحافظة',
    he: 'העתק ללוח',
  },
  'modal.copied': {
    en: 'Copied!',
    ru: 'Скопировано!',
    ka: 'კოპირებულია!',
    ar: 'تم النسخ!',
    he: 'הועתק!',
  },
  'modal.downloadAsFile': {
    en: 'Download as File',
    ru: 'Скачать файлом',
    ka: 'ფაილის ჩამოტვირთვა',
    ar: 'تحميل كملف',
    he: 'הורדה כקובץ',
  },
  'modal.dontClose': {
    en: '⚠️ Do NOT close this window until you\'ve saved your credentials!',
    ru: '⚠️ НЕ закрывайте это окно, пока не сохраните учётные данные!',
    ka: '⚠️ არ დახუროთ ეს ფანჯარა, სანამ არ შეინახავთ ავტორიზაციის მონაცემებს!',
    ar: '⚠️ لا تقم بإغلاق هذه النافذة قبل حفظ بيانات الاعتماد!',
    he: '⚠️ אל תסגור את החלון הזה עד שתשמור את פרטי הכניסה!',
  },
  'modal.noRecovery': {
    en: 'There is no password recovery',
    ru: 'Восстановление пароля невозможно',
    ka: 'პაროლის აღდგენა შეუძლებელია',
    ar: 'لا يوجد استرداد لكلمة المرور',
    he: 'אין שחזור סיסמה',
  },
  'modal.losingToken': {
    en: 'Losing your token means losing access',
    ru: 'Потеря токена означает потерю доступа',
    ka: 'ტოკენის დაკარგვა ნიშნავს წვდომის დაკარგვას',
    ar: 'فقدان الرمز يعني فقدان الوصول',
    he: 'איבוד האסימון פירושו איבוד גישה',
  },
  'modal.storeSecurely': {
    en: 'Store it in a secure password manager',
    ru: 'Храните его в надёжном менеджере паролей',
    ka: 'დააცალეთ უსაფრთხოების მენეჯერში',
    ar: 'احفظه في مدير كلمات مرور آمن',
    he: 'שמור אותו במנהל סיסמאות מאובטח',
  },
  'modal.savedConfirm': {
    en: 'I have saved my username and login token offline and understand I cannot recover them.',
    ru: 'Я сохранил имя пользователя и токен входа и понимаю, что их восстановление невозможно.',
    ka: 'მე შევინახე მომხმარებლის სახელი და შესვლის ტოკენი და ვიცი, რომ მათი აღდგენა შეუძლებელია.',
    ar: 'لقد حفظت اسم المستخدم ورمز تسجيل الدخول وأفهم أنه لا يمكن استردادهما.',
    he: 'שמרתי את שם המשתמש ואסימון הכניסה שלי ואני מבין שלא ניתן לשחזר אותם.',
  },
  'modal.continueDashboard': {
    en: 'Continue to Dashboard',
    ru: 'Перейти к панели',
    ka: 'დაფაზაზე გადასვლა',
    ar: 'الانتقال إلى لوحة التحكم',
    he: 'המשך ללוח הבקרה',
  },
  'modal.createTeam': {
    en: 'Create New Team',
    ru: 'Создать новую команду',
    ka: 'ახალი გუნდის შექმნა',
    ar: 'إنشاء فريق جديد',
    he: 'צור צוות חדש',
  },
  'modal.teamName': {
    en: 'Team Name',
    ru: 'Название команды',
    ka: 'გუნდის სახელი',
    ar: 'اسم الفريق',
    he: 'שם הצוות',
  },
  'modal.teamNamePlaceholder': {
    en: 'my-awesome-team',
    ru: 'моя-крутая-команда',
    ka: 'ჩემი-საოცრაიებო-გუნდი',
    ar: 'فريقي-الرائع',
    he: 'הצווח-המדהים-שלי',
  },
  'modal.teamDesc': {
    en: 'Description (optional)',
    ru: 'Описание (необязательно)',
    ka: 'აღწერა (არასავალდებულო)',
    ar: 'الوصف (اختياري)',
    he: 'תיאור (אופציונלי)',
  },
  'modal.teamDescPlaceholder': {
    en: 'What is this team for?',
    ru: 'Для чего эта команда?',
    ka: 'რისთვის არის ეს გუნდი?',
    ar: 'ما هو الغرض من هذا الفريق؟',
    he: 'למה הצוות הזה משרת?',
  },
  'modal.cancel': {
    en: 'Cancel',
    ru: 'Отмена',
    ka: 'გაუქმება',
    ar: 'إلغاء',
    he: 'ביטול',
  },
  'modal.createTeamBtn': {
    en: 'Create Team',
    ru: 'Создать команду',
    ka: 'გუნდის შექმნა',
    ar: 'إنشاء الفريق',
    he: 'צור צוות',
  },
  'modal.addAgent': {
    en: 'Add Agent',
    ru: 'Добавить агента',
    ka: 'აგენტის დამატება',
    ar: 'إضافة وكيل',
    he: 'הוסף סוכן',
  },
  'modal.agentName': {
    en: 'Agent Name',
    ru: 'Имя агента',
    ka: 'აგენტის სახელი',
    ar: 'اسم الوكيل',
    he: 'שם הסוכן',
  },
  'modal.agentNamePlaceholder': {
    en: 'agent-name',
    ru: 'имя-агента',
    ka: 'აგენტის-სახელი',
    ar: 'اسم-الوكيل',
    he: 'שם-הסוכן',
  },
  'modal.role': {
    en: 'Role',
    ru: 'Роль',
    ka: 'როლი',
    ar: 'الدور',
    he: 'תפקיד',
  },
  'modal.addAgentBtn': {
    en: 'Add Agent',
    ru: 'Добавить агента',
    ka: 'აგენტის დამატება',
    ar: 'إضافة الوكيل',
    he: 'הוסף סוכן',
  },
  'modal.newInstruction': {
    en: 'New Instruction',
    ru: 'Новая инструкция',
    ka: 'ახალი ინსტრუქცია',
    ar: 'تعليمة جديدة',
    he: 'הוראה חדשה',
  },
  'modal.title': {
    en: 'Title',
    ru: 'Заголовок',
    ka: 'სათაური',
    ar: 'العنوان',
    he: 'כותרת',
  },
  'modal.titlePlaceholder': {
    en: 'Task title',
    ru: 'Название задачи',
    ka: 'ამოცანის სათაური',
    ar: 'عنوان المهمة',
    he: 'כותרת המשימה',
  },
  'modal.content': {
    en: 'Content',
    ru: 'Содержание',
    ka: 'შიგთავსი',
    ar: 'المحتوى',
    he: 'תוכן',
  },
  'modal.contentPlaceholder': {
    en: 'Describe the task...',
    ru: 'Опишите задачу...',
    ka: 'აღწერეთ ამოცანა...',
    ar: 'صِف المهمة...',
    he: 'תאר את המשימה...',
  },
  'modal.priority': {
    en: 'Priority',
    ru: 'Приоритет',
    ka: 'პრიორიტეტი',
    ar: 'الأولوية',
    he: 'עדיפות',
  },
  'modal.priorityLow': {
    en: 'Low',
    ru: 'Низкий',
    ka: 'დაბალი',
    ar: 'منخفض',
    he: 'נמוכה',
  },
  'modal.priorityNormal': {
    en: 'Normal',
    ru: 'Обычный',
    ka: 'ჩვეულებრივი',
    ar: 'عادي',
    he: 'רגילה',
  },
  'modal.priorityHigh': {
    en: 'High',
    ru: 'Высокий',
    ka: 'მაღალი',
    ar: 'مرتفع',
    he: 'גבוהה',
  },
  'modal.priorityUrgent': {
    en: 'Urgent',
    ru: 'Срочный',
    ka: 'სასწროფო',
    ar: 'عاجل',
    he: 'דחופה',
  },
  'modal.assignee': {
    en: 'Assignee',
    ru: 'Исполнитель',
    ka: 'შემსრულებელი',
    ar: 'المُنفَّذ',
    he: 'מוקצה ל',
  },
  'modal.create': {
    en: 'Create',
    ru: 'Создать',
    ka: 'შექმნა',
    ar: 'إنشاء',
    he: 'יצירה',
  },
  'modal.inviteAgent': {
    en: 'Invite Agent',
    ru: 'Пригласить агента',
    ka: 'აგენტის მოწვევა',
    ar: 'دعوة وكيل',
    he: 'הזמן סוכן',
  },
  'modal.inviteCreated': {
    en: 'Invite created! Share this code with the agent:',
    ru: 'Приглашение создано! Поделитесь этим кодом с агентом:',
    ka: 'მოწვევა შეიქმნა! გაუზიარეთ ეს კოდი აგენტს:',
    ar: 'تم إنشاء الدعوة! شارك هذا الرمز مع الوكيل:',
    he: 'ההזמנה נוצרה! שתף קוד זה עם הסוכן:',
  },
  'modal.inviteCode': {
    en: 'Invite Code',
    ru: 'Код приглашения',
    ka: 'მოწვევის კოდი',
    ar: 'رمز الدعوة',
    he: 'קוד הזמנה',
  },
  'modal.agentToken': {
    en: 'Agent Token',
    ru: 'Токен агента',
    ka: 'აგენტის ტოკენი',
    ar: 'رمز الوكيل',
    he: 'אסימון סוכן',
  },
  'modal.copyCodeClose': {
    en: 'Copy Code & Close',
    ru: 'Копировать код и закрыть',
    ka: 'კოდის კოპირება და დახურვა',
    ar: 'نسخ الرمز وإغلاق',
    he: 'העתק קוד וסגור',
  },
  'modal.expiresIn': {
    en: 'Expires In (hours, optional)',
    ru: 'Срок действия (часы, необязательно)',
    ka: 'მოქმედების ვადა (საათები, არასავალდებულო)',
    ar: 'مدة الصلاحية (ساعات، اختياري)',
    he: 'תפוגה (שעות, אופציונלי)',
  },
  'modal.createInvite': {
    en: 'Create Invite',
    ru: 'Создать приглашение',
    ka: 'მოწვევის შექმნა',
    ar: 'إنشاء دعوة',
    he: 'צור הזמנה',
  },
  'modal.creatingInvite': {
    en: 'Creating human invite...',
    ru: 'Создание приглашения для человека...',
    ka: 'ადამიანის მოწვევის შექმნა...',
    ar: 'جارٍ إنشاء دعوة لشخص...',
    he: 'יוצר הזמנה לאדם...',
  },
  'modal.humanInviteCreated': {
    en: 'Human Invite Created',
    ru: 'Приглашение для человека создано',
    ka: 'ადამიანის მოწვევა შეიქმნა',
    ar: 'تم إنشاء دعوة الشخص',
    he: 'הזמנת אדם נוצרה',
  },
  'modal.shareCredentials': {
    en: 'Share These Credentials',
    ru: 'Поделитесь этими данными',
    ka: 'გაუზიარეთ ეს მონაცემები',
    ar: 'شارك بيانات الاعتماد هذه',
    he: 'שתף פרטי כניסה אלו',
  },
  'modal.shareWarning': {
    en: '⚠️ Share these login credentials with the human. They will NOT be shown again.',
    ru: '⚠️ Поделитесь этими учётными данными с человеком. Они больше НЕ будут показаны.',
    ka: '⚠️ გაუზიარეთ ეს ავტორიზაციის მონაცემები ადამიანს. ისინი ხელმეორედ არ გამოჩნდება.',
    ar: '⚠️ شارك بيانات الاعتماد هذه مع الشخص. لن تظهر مرة أخرى.',
    he: '⚠️ שתף פרטי כניסה אלו עם האדם. הם לא יוצגו שוב.',
  },
  'modal.copyAll': {
    en: 'Copy All',
    ru: 'Копировать всё',
    ka: 'ყველაფრის კოპირება',
    ar: 'نسخ الكل',
    he: 'העתק הכל',
  },
  'modal.download': {
    en: 'Download',
    ru: 'Скачать',
    ka: 'ჩამოტვირთვა',
    ar: 'تحميل',
    he: 'הורדה',
  },
  'modal.ownerToken': {
    en: 'Owner Token',
    ru: 'Токен владельца',
    ka: 'მფლობელის ტოკენი',
    ar: 'رمز المالك',
    he: 'אסימון בעלים',
  },
  'modal.ownerTokenDesc': {
    en: 'Use this token for admin API operations. Keep it secret.',
    ru: 'Используйте этот токен для административных операций API. Храните в секрете.',
    ka: 'გამოიყენეთ ეს ტოკენი ადმინისტრაციული API ოპერაციებისთვის. დაიცალეთ.',
    ar: 'استخدم هذا الرمز لعمليات API الإدارية. احفظه سرًا.',
    he: 'השתמש באסימון זה לפעולות API ניהוליות. שמור אותו בסוד.',
  },
  'modal.copyToken': {
    en: 'Copy Token',
    ru: 'Копировать токен',
    ka: 'ტოკენის კოპირება',
    ar: 'نسخ الرمز',
    he: 'העתק אסימון',
  },
  'modal.close': {
    en: 'Close',
    ru: 'Закрыть',
    ka: 'დახურვა',
    ar: 'إغلاق',
    he: 'סגירה',
  },
  'modal.confirmRemoveAgent': {
    en: 'Remove this agent?',
    ru: 'Удалить этого агента?',
    ka: 'წავშალოთ ეს აგენტი?',
    ar: 'إزالة هذا الوكيل؟',
    he: 'להסיר את הסוכן הזה?',
  },
  'modal.confirmDeleteTeam': {
    en: 'Delete this team? This cannot be undone.',
    ru: 'Удалить эту команду? Это действие необратимо.',
    ka: 'წავშალოთ ეს გუნდი? ეს მოქმედება შეუქანებელია.',
    ar: 'حذف هذا الفريق؟ لا يمكن التراجع عن هذا الإجراء.',
    he: 'למחוק את הצוות הזה? לא ניתן לבטל את הפעולה.',
  },
  'modal.fileLoadError': {
    en: 'Failed to load file.',
    ru: 'Не удалось загрузить файл.',
    ka: 'ფაილის ჩატვირთვა ვერ მოხერხდა.',
    ar: 'فشل تحميل الملف.',
    he: 'טעינת הקובץ נכשלה.',
  },

  // ── Time ago ──────────────────────────────────────────────────────────────
  'time.justNow': {
    en: 'just now',
    ru: 'только что',
    ka: 'ახლახანს',
    ar: 'الآن',
    he: 'עכשיו',
  },
  'time.minutesAgo': {
    en: '{n} min ago',
    ru: '{n} мин. назад',
    ka: '{n} წუთის წინ',
    ar: 'منذ {n} دقيقة',
    he: 'לפני {n} דקות',
  },
  'time.hoursAgo': {
    en: '{n}h ago',
    ru: '{n} ч. назад',
    ka: '{n} საათის წინ',
    ar: 'منذ {n} ساعة',
    he: 'לפני {n} שעות',
  },
  'time.daysAgo': {
    en: '{n}d ago',
    ru: '{n} дн. назад',
    ka: '{n} დღის წინ',
    ar: 'منذ {n} يوم',
    he: 'לפני {n} ימים',
  },

  // ── Promo ─────────────────────────────────────────────────────────────────
  'promo.builtWith': {
    en: 'Built with',
    ru: 'Создано на',
    ka: 'შექმნილია',
    ar: 'بُني باستخدام',
    he: 'נבנה עם',
  },
  'promo.modelName': {
    en: 'Z.AI GLM 5 Turbo',
    ru: 'Z.AI GLM 5 Turbo',
    ka: 'Z.AI GLM 5 Turbo',
    ar: 'Z.AI GLM 5 Turbo',
    he: 'Z.AI GLM 5 Turbo',
  },
  'promo.inviteTitle': {
    en: "🚀 You've been invited to join the GLM Coding Plan!",
    ru: '🚀 Вас приглашают присоединиться к GLM Coding Plan!',
    ka: '🚀 მოგიწვევთ შეუერთდეთ GLM Coding Plan-ს!',
    ar: '🚀 لقد تمت دعوتك للانضمام إلى GLM Coding Plan!',
    he: '🚀 הוזמנת להצטרף ל-GLM Coding Plan!',
  },
  'promo.inviteDesc': {
    en: 'Enjoy full support for Claude Code, Cline, and 20+ top coding tools — starting at just $18/month. Subscribe now and grab the limited-time deal!',
    ru: 'Полная поддержка Claude Code, Cline и 20+ лучших инструментов для программирования — всего от $18/мес. Подпишитесь сейчас и используйте ограниченное предложение!',
    ka: 'სრული მხარდაჭერა Claude Code, Cline და 20+ საუკეთესო პროგრამირების ინსტრუმენტისთვის — დაწყებული $18/თვიდან. გამოწერეთ ახლა და ისარგებლეთ შეზღუდულ შეთავაზებით!',
    ar: 'استمتع بدعم كامل لـ Claude Code و Cline وأكثر من 20 أداة برمجية رائدة — بدءًا من 18$ شهريًا فقط. اشترك الآن واحصل على العرض المحدود!',
    he: 'תיהנה מתמיכה מלאה ב-Claude Code, Cline ועוד 20+ כלי פיתוח מובילים — החל מ-18$ בחודש בלבד. הירשם עכשיו ותפוס את המבצע המוגבל!',
  },
  'promo.joinNow': {
    en: 'Join now',
    ru: 'Присоединиться',
    ka: 'შეუერთდი',
    ar: 'انضم الآن',
    he: 'הצטרף עכשיו',
  },

  // ── Credits ───────────────────────────────────────────────────────────────
  'credits.developedBy': {
    en: 'Developed by',
    ru: 'Разработано',
    ka: 'შექმნილია',
    ar: 'تطوير',
    he: 'פותח על ידי',
  },
  'credits.name': {
    en: 'Roman',
    ru: 'Roman',
    ka: 'Roman',
    ar: 'Roman',
    he: 'Roman',
  },
  'credits.telegram': {
    en: 'Telegram Channel',
    ru: 'Telegram-канал',
    ka: 'Telegram არხი',
    ar: 'قناة تيليجرام',
    he: 'ערוץ טלגרם',
  },
  'credits.portfolio': {
    en: 'Portfolio',
    ru: 'Портфолио',
    ka: 'პორტფოლიო',
    ar: 'معرض الأعمال',
    he: 'תיק עבודות',
  },
  'credits.blog': {
    en: 'LLM Tech Blog',
    ru: 'Блог о LLM',
    ka: 'LLM ტექნოლოგიების ბლოგი',
    ar: 'مدونة تقنيات LLM',
    he: 'בלוג טכנולוגי LLM',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  'footer.text': {
    en: 'MemTrant — Transit Memory Server for AI Agent Teams',
    ru: 'MemTrant — Сервер общей памяти для команд ИИ-агентов',
    ka: 'MemTrant — ტრანზიტული მეხსიერების სერვერი აი-აგენტთა გუნდებისთვის',
    ar: 'MemTrant — خادم الذاكرة العابرة لفرق وكلاء الذكاء الاصطناعي',
    he: 'MemTrant — שרת זיכרון מעבר לצוותי סוכני AI',
  },

  // ── GitHub ────────────────────────────────────────────────────────────────
  'github.star': {
    en: 'Support the project on Github',
    ru: 'Поддержите проект на Github',
    ka: 'მხარდაჭერეთ პროექტი Github-ზე',
    ar: 'ادعم المشروع على Github',
    he: 'תמוך בפרויקט ב-Github',
  },
};

// ─── Pluralization helpers ──────────────────────────────────────────────────────

/** Russian-style Slavic pluralization */
function ruPlural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const lastTwo = abs % 100;
  const lastOne = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return `${n} ${many}`;
  if (lastOne === 1) return `${n} ${one}`;
  if (lastOne >= 2 && lastOne <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

/** Arabic pluralization (simplified: 1, 2, 3-10, 11+) */
function arPlural(n: number, one: string, two: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return few.replace('{n}', String(n));
  return many.replace('{n}', String(n));
}

/** Hebrew pluralization (simplified: 1 singular, 2+ plural) */
function hePlural(n: number, one: string, plural: string): string {
  if (n === 1) return one;
  return `${n} ${plural}`;
}

// ─── getTimeAgo ─────────────────────────────────────────────────────────────────

export function getTimeAgo(lang: Lang): {
  justNow: string;
  minutesAgo: (m: number) => string;
  hoursAgo: (h: number) => string;
  daysAgo: (d: number) => string;
} {
  const justNow = translations['time.justNow'][lang];

  switch (lang) {
    case 'en':
      return {
        justNow,
        minutesAgo: (m) => `${m} min ago`,
        hoursAgo: (h) => `${h}h ago`,
        daysAgo: (d) => `${d}d ago`,
      };

    case 'ru':
      return {
        justNow,
        minutesAgo: (m) => ruPlural(m, 'минуту', 'минуты', 'минут') + ' назад',
        hoursAgo: (h) => ruPlural(h, 'час', 'часа', 'часов') + ' назад',
        daysAgo: (d) => ruPlural(d, 'день', 'дня', 'дней') + ' назад',
      };

    case 'ka':
      return {
        justNow,
        minutesAgo: (m) => `${m} წუთის წინ`,
        hoursAgo: (h) => `${h} საათის წინ`,
        daysAgo: (d) => `${d} დღის წინ`,
      };

    case 'ar':
      return {
        justNow,
        minutesAgo: (m) =>
          arPlural(
            m,
            'منذ دقيقة',
            'منذ دقيقتين',
            'منذ {n} دقائق',
            'منذ {n} دقيقة',
          ),
        hoursAgo: (h) =>
          arPlural(
            h,
            'منذ ساعة',
            'منذ ساعتين',
            'منذ {n} ساعات',
            'منذ {n} ساعة',
          ),
        daysAgo: (d) =>
          arPlural(
            d,
            'منذ يوم',
            'منذ يومين',
            'منذ {n} أيام',
            'منذ {n} يوم',
          ),
      };

    case 'he':
      return {
        justNow,
        minutesAgo: (m) => hePlural(m, 'לפני דקה', 'דקות'),
        hoursAgo: (h) => hePlural(h, 'לפני שעה', 'שעות'),
        daysAgo: (d) => hePlural(d, 'אתמול', 'ימים'),
      };
  }
}

// ─── useT — hook-like translation accessor ─────────────────────────────────────

export function useT(lang: Lang): (key: string, replacements?: Record<string, string | number>) => string {
  return (key: string, replacements?: Record<string, string | number>): string => {
    const entry = translations[key];
    if (!entry) return key;
    let text = entry[lang] ?? entry['en'] ?? key;
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  };
}
