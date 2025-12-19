'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'de' | 'fa';

export const LANGUAGES: Record<Language, { name: string; nativeName: string; dir: 'ltr' | 'rtl' }> = {
  en: { name: 'English', nativeName: 'English', dir: 'ltr' },
  de: { name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  fa: { name: 'Persian', nativeName: 'فارسی', dir: 'rtl' },
};

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  en: {
    // App
    'app.name': 'Find Your Root',
    'app.version': 'Version 2.5.0',
    
    // Navigation
    'nav.tree': 'Tree',
    'nav.search': 'Search',
    'nav.admin': 'Admin',
    'nav.settings': 'Settings',
    'nav.about': 'About',
    
    // Login/Register
    'auth.signIn': 'Sign in',
    'auth.signOut': 'Sign Out',
    'auth.register': 'Register',
    'auth.createAccount': 'Create Account',
    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.enterEmail': 'Enter your email',
    'auth.enterPassword': 'Enter your password',
    'auth.createPassword': 'Create a password (min 6 characters)',
    'auth.reenterPassword': 'Re-enter your password',
    'auth.passwordsMatch': 'Passwords match',
    'auth.passwordsDontMatch': 'Passwords do not match',
    'auth.fatherName': "Father's Name",
    'auth.enterFatherName': "Enter your father's full name",
    'auth.birthYear': 'Your Birth Year',
    'auth.enterBirthYear': 'e.g., 1990',
    'auth.familyTree': 'Family Tree',
    'auth.signingIn': 'Signing in...',
    'auth.creatingAccount': 'Creating account...',
    'auth.alreadyHaveAccount': 'Already have an account? Sign in',
    'auth.dontHaveAccount': "Don't have an account? Register",
    'auth.signInToAccess': 'Sign in to access your family tree',
    'auth.createAccountToView': 'Create an account to view the family tree',
    'auth.verifyFamily': "We'll verify you're part of the Batur family tree",
    'auth.newUserInfo': 'New users will be registered as viewers. You can request elevated permissions after registration.',
    'auth.signInOrRegister': 'Sign in with your credentials or register a new account',
    'auth.accountCreated': 'Account created successfully! Redirecting...',
    
    // Settings
    'settings.title': 'Settings',
    'settings.appSettings': 'App Settings',
    'settings.notifications': 'Notifications',
    'settings.notificationsBlocked': 'Blocked - enable in browser settings',
    'settings.notificationsTapToEnable': 'Tap to enable',
    'settings.notificationsEnabled': 'Enabled',
    'settings.notificationsDisabled': 'Disabled',
    'settings.notificationsUnsupported': 'Not supported in this browser',
    'settings.offlineAccess': 'Offline Access',
    'settings.connected': 'Connected',
    'settings.offlineModeActive': 'Offline mode active',
    'settings.language': 'Language',
    'settings.selectLanguage': 'Select language',
    
    // Tree Management
    'settings.treeManagement': 'Tree Management',
    'settings.exportData': 'Export Data',
    'settings.exportDescription': 'Download tree as JSON, CSV, or Text',
    'settings.shareTree': 'Share Tree',
    
    // Account
    'settings.account': 'Account',
    'settings.adminFullAccess': 'Admin (Full Access)',
    'settings.coAdminCanApprove': 'Co-Admin (Can approve)',
    'settings.contributorCanSuggest': 'Contributor (Can suggest)',
    'settings.viewerViewOnly': 'Viewer (View only)',
    'settings.myTreeIdentity': 'My Tree Identity',
    'settings.claimMyIdentity': 'Claim My Identity',
    'settings.linkedAs': 'Linked as',
    'settings.familyMember': 'family member',
    'settings.linkProfileToTree': 'Link your profile to the tree',
    'settings.linked': 'Linked',
    'settings.requestUpgrade': 'Request Upgrade',
    'settings.askAdminForAccess': 'Ask admin for higher access',
    
    // Offline
    'offline.youreOffline': "You're offline",
    'offline.actionsWillSync': 'action(s) will sync when you\'re back online',
    'offline.changesWillBeSaved': 'Changes will be saved when you reconnect',
    'offline.syncingChanges': 'Syncing changes...',
    'offline.actionsPending': 'action(s) pending',
    
    // Tree
    'tree.title': 'Family Tree',
    'tree.resetView': 'Reset View',
    'tree.zoomIn': 'Zoom In',
    'tree.zoomOut': 'Zoom Out',
    'tree.addPerson': 'Add Person',
    'tree.editPerson': 'Edit Person',
    'tree.deletePerson': 'Delete Person',
    
    // Search
    'search.title': 'Search',
    'search.placeholder': 'Search by name, location...',
    'search.noResults': 'No results found',
    'search.results': 'results',
    
    // Person
    'person.name': 'Name',
    'person.role': 'Role',
    'person.location': 'Location',
    'person.birthYear': 'Birth Year',
    'person.deathYear': 'Death Year',
    'person.bio': 'Biography',
    'person.instagram': 'Instagram',
    'person.children': 'Children',
    'person.parent': 'Parent',
    'person.spouse': 'Spouse',
    'person.gender': 'Gender',
    'person.male': 'Male',
    'person.female': 'Female',
    
    // Admin
    'admin.title': 'Admin Panel',
    'admin.suggestions': 'Suggestions',
    'admin.users': 'Users',
    'admin.permissions': 'Permission Requests',
    'admin.identityClaims': 'Identity Claims',
    'admin.populateTree': 'Populate Tree',
    'admin.approve': 'Approve',
    'admin.reject': 'Reject',
    'admin.pending': 'Pending',
    'admin.approved': 'Approved',
    'admin.rejected': 'Rejected',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.submit': 'Submit',
  },
  
  de: {
    // App
    'app.name': 'Finde Deine Wurzeln',
    'app.version': 'Version 2.5.0',
    
    // Navigation
    'nav.tree': 'Stammbaum',
    'nav.search': 'Suche',
    'nav.admin': 'Admin',
    'nav.settings': 'Einstellungen',
    'nav.about': 'Über',
    
    // Login/Register
    'auth.signIn': 'Anmelden',
    'auth.signOut': 'Abmelden',
    'auth.register': 'Registrieren',
    'auth.createAccount': 'Konto erstellen',
    'auth.email': 'E-Mail-Adresse',
    'auth.password': 'Passwort',
    'auth.confirmPassword': 'Passwort bestätigen',
    'auth.enterEmail': 'E-Mail eingeben',
    'auth.enterPassword': 'Passwort eingeben',
    'auth.createPassword': 'Passwort erstellen (min. 6 Zeichen)',
    'auth.reenterPassword': 'Passwort erneut eingeben',
    'auth.passwordsMatch': 'Passwörter stimmen überein',
    'auth.passwordsDontMatch': 'Passwörter stimmen nicht überein',
    'auth.fatherName': 'Name des Vaters',
    'auth.enterFatherName': 'Vollständigen Namen des Vaters eingeben',
    'auth.birthYear': 'Geburtsjahr',
    'auth.enterBirthYear': 'z.B. 1990',
    'auth.familyTree': 'Stammbaum',
    'auth.signingIn': 'Anmeldung läuft...',
    'auth.creatingAccount': 'Konto wird erstellt...',
    'auth.alreadyHaveAccount': 'Bereits ein Konto? Anmelden',
    'auth.dontHaveAccount': 'Kein Konto? Registrieren',
    'auth.signInToAccess': 'Melden Sie sich an, um auf Ihren Stammbaum zuzugreifen',
    'auth.createAccountToView': 'Erstellen Sie ein Konto, um den Stammbaum anzuzeigen',
    'auth.verifyFamily': 'Wir überprüfen, ob Sie zur Batur-Familie gehören',
    'auth.newUserInfo': 'Neue Benutzer werden als Betrachter registriert. Sie können nach der Registrierung erweiterte Berechtigungen anfordern.',
    'auth.signInOrRegister': 'Mit Ihren Zugangsdaten anmelden oder ein neues Konto registrieren',
    'auth.accountCreated': 'Konto erfolgreich erstellt! Weiterleitung...',
    
    // Settings
    'settings.title': 'Einstellungen',
    'settings.appSettings': 'App-Einstellungen',
    'settings.notifications': 'Benachrichtigungen',
    'settings.notificationsBlocked': 'Blockiert - in Browsereinstellungen aktivieren',
    'settings.notificationsTapToEnable': 'Tippen zum Aktivieren',
    'settings.notificationsEnabled': 'Aktiviert',
    'settings.notificationsDisabled': 'Deaktiviert',
    'settings.notificationsUnsupported': 'In diesem Browser nicht unterstützt',
    'settings.offlineAccess': 'Offline-Zugriff',
    'settings.connected': 'Verbunden',
    'settings.offlineModeActive': 'Offline-Modus aktiv',
    'settings.language': 'Sprache',
    'settings.selectLanguage': 'Sprache auswählen',
    
    // Tree Management
    'settings.treeManagement': 'Stammbaum-Verwaltung',
    'settings.exportData': 'Daten exportieren',
    'settings.exportDescription': 'Stammbaum als JSON, CSV oder Text herunterladen',
    'settings.shareTree': 'Stammbaum teilen',
    
    // Account
    'settings.account': 'Konto',
    'settings.adminFullAccess': 'Admin (Vollzugriff)',
    'settings.coAdminCanApprove': 'Co-Admin (Kann genehmigen)',
    'settings.contributorCanSuggest': 'Mitwirkender (Kann vorschlagen)',
    'settings.viewerViewOnly': 'Betrachter (Nur ansehen)',
    'settings.myTreeIdentity': 'Meine Stammbaum-Identität',
    'settings.claimMyIdentity': 'Identität beanspruchen',
    'settings.linkedAs': 'Verknüpft als',
    'settings.familyMember': 'Familienmitglied',
    'settings.linkProfileToTree': 'Profil mit Stammbaum verknüpfen',
    'settings.linked': 'Verknüpft',
    'settings.requestUpgrade': 'Upgrade anfordern',
    'settings.askAdminForAccess': 'Admin um höheren Zugriff bitten',
    
    // Offline
    'offline.youreOffline': 'Sie sind offline',
    'offline.actionsWillSync': 'Aktion(en) werden synchronisiert, wenn Sie wieder online sind',
    'offline.changesWillBeSaved': 'Änderungen werden beim erneuten Verbinden gespeichert',
    'offline.syncingChanges': 'Änderungen werden synchronisiert...',
    'offline.actionsPending': 'Aktion(en) ausstehend',
    
    // Tree
    'tree.title': 'Stammbaum',
    'tree.resetView': 'Ansicht zurücksetzen',
    'tree.zoomIn': 'Vergrößern',
    'tree.zoomOut': 'Verkleinern',
    'tree.addPerson': 'Person hinzufügen',
    'tree.editPerson': 'Person bearbeiten',
    'tree.deletePerson': 'Person löschen',
    
    // Search
    'search.title': 'Suche',
    'search.placeholder': 'Nach Name, Ort suchen...',
    'search.noResults': 'Keine Ergebnisse gefunden',
    'search.results': 'Ergebnisse',
    
    // Person
    'person.name': 'Name',
    'person.role': 'Rolle',
    'person.location': 'Ort',
    'person.birthYear': 'Geburtsjahr',
    'person.deathYear': 'Todesjahr',
    'person.bio': 'Biografie',
    'person.instagram': 'Instagram',
    'person.children': 'Kinder',
    'person.parent': 'Elternteil',
    'person.spouse': 'Ehepartner',
    'person.gender': 'Geschlecht',
    'person.male': 'Männlich',
    'person.female': 'Weiblich',
    
    // Admin
    'admin.title': 'Admin-Bereich',
    'admin.suggestions': 'Vorschläge',
    'admin.users': 'Benutzer',
    'admin.permissions': 'Berechtigungsanfragen',
    'admin.identityClaims': 'Identitätsansprüche',
    'admin.populateTree': 'Stammbaum befüllen',
    'admin.approve': 'Genehmigen',
    'admin.reject': 'Ablehnen',
    'admin.pending': 'Ausstehend',
    'admin.approved': 'Genehmigt',
    'admin.rejected': 'Abgelehnt',
    
    // Common
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.add': 'Hinzufügen',
    'common.close': 'Schließen',
    'common.confirm': 'Bestätigen',
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'common.yes': 'Ja',
    'common.no': 'Nein',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.submit': 'Absenden',
  },
  
  fa: {
    // App
    'app.name': 'ریشه‌یابی',
    'app.version': 'نسخه ۲.۵.۰',
    
    // Navigation
    'nav.tree': 'شجره‌نامه',
    'nav.search': 'جستجو',
    'nav.admin': 'مدیریت',
    'nav.settings': 'تنظیمات',
    'nav.about': 'درباره',
    
    // Login/Register
    'auth.signIn': 'ورود',
    'auth.signOut': 'خروج',
    'auth.register': 'ثبت‌نام',
    'auth.createAccount': 'ایجاد حساب',
    'auth.email': 'آدرس ایمیل',
    'auth.password': 'رمز عبور',
    'auth.confirmPassword': 'تأیید رمز عبور',
    'auth.enterEmail': 'ایمیل خود را وارد کنید',
    'auth.enterPassword': 'رمز عبور خود را وارد کنید',
    'auth.createPassword': 'رمز عبور ایجاد کنید (حداقل ۶ کاراکتر)',
    'auth.reenterPassword': 'رمز عبور را دوباره وارد کنید',
    'auth.passwordsMatch': 'رمزهای عبور مطابقت دارند',
    'auth.passwordsDontMatch': 'رمزهای عبور مطابقت ندارند',
    'auth.fatherName': 'نام پدر',
    'auth.enterFatherName': 'نام کامل پدر خود را وارد کنید',
    'auth.birthYear': 'سال تولد',
    'auth.enterBirthYear': 'مثلاً ۱۳۷۰',
    'auth.familyTree': 'شجره‌نامه',
    'auth.signingIn': 'در حال ورود...',
    'auth.creatingAccount': 'در حال ایجاد حساب...',
    'auth.alreadyHaveAccount': 'قبلاً حساب دارید؟ وارد شوید',
    'auth.dontHaveAccount': 'حساب ندارید؟ ثبت‌نام کنید',
    'auth.signInToAccess': 'برای دسترسی به شجره‌نامه وارد شوید',
    'auth.createAccountToView': 'برای مشاهده شجره‌نامه حساب ایجاد کنید',
    'auth.verifyFamily': 'ما بررسی می‌کنیم که شما عضو خانواده باتور هستید',
    'auth.newUserInfo': 'کاربران جدید به عنوان بیننده ثبت می‌شوند. پس از ثبت‌نام می‌توانید دسترسی بالاتر درخواست دهید.',
    'auth.signInOrRegister': 'با اطلاعات خود وارد شوید یا حساب جدید بسازید',
    'auth.accountCreated': 'حساب با موفقیت ایجاد شد! در حال انتقال...',
    
    // Settings
    'settings.title': 'تنظیمات',
    'settings.appSettings': 'تنظیمات برنامه',
    'settings.notifications': 'اعلان‌ها',
    'settings.notificationsBlocked': 'مسدود شده - در تنظیمات مرورگر فعال کنید',
    'settings.notificationsTapToEnable': 'برای فعال‌سازی لمس کنید',
    'settings.notificationsEnabled': 'فعال',
    'settings.notificationsDisabled': 'غیرفعال',
    'settings.notificationsUnsupported': 'در این مرورگر پشتیبانی نمی‌شود',
    'settings.offlineAccess': 'دسترسی آفلاین',
    'settings.connected': 'متصل',
    'settings.offlineModeActive': 'حالت آفلاین فعال',
    'settings.language': 'زبان',
    'settings.selectLanguage': 'انتخاب زبان',
    
    // Tree Management
    'settings.treeManagement': 'مدیریت شجره‌نامه',
    'settings.exportData': 'خروجی داده',
    'settings.exportDescription': 'دانلود شجره‌نامه به صورت JSON، CSV یا متن',
    'settings.shareTree': 'اشتراک‌گذاری شجره‌نامه',
    
    // Account
    'settings.account': 'حساب کاربری',
    'settings.adminFullAccess': 'مدیر (دسترسی کامل)',
    'settings.coAdminCanApprove': 'مدیر مشارکتی (می‌تواند تایید کند)',
    'settings.contributorCanSuggest': 'مشارکت‌کننده (می‌تواند پیشنهاد دهد)',
    'settings.viewerViewOnly': 'بیننده (فقط مشاهده)',
    'settings.myTreeIdentity': 'هویت من در شجره‌نامه',
    'settings.claimMyIdentity': 'ادعای هویت',
    'settings.linkedAs': 'متصل به عنوان',
    'settings.familyMember': 'عضو خانواده',
    'settings.linkProfileToTree': 'اتصال پروفایل به شجره‌نامه',
    'settings.linked': 'متصل',
    'settings.requestUpgrade': 'درخواست ارتقا',
    'settings.askAdminForAccess': 'از مدیر دسترسی بالاتر بخواهید',
    
    // Offline
    'offline.youreOffline': 'شما آفلاین هستید',
    'offline.actionsWillSync': 'عمل(ها) هنگام آنلاین شدن همگام‌سازی می‌شوند',
    'offline.changesWillBeSaved': 'تغییرات هنگام اتصال مجدد ذخیره می‌شوند',
    'offline.syncingChanges': 'در حال همگام‌سازی تغییرات...',
    'offline.actionsPending': 'عمل(ها) در انتظار',
    
    // Tree
    'tree.title': 'شجره‌نامه',
    'tree.resetView': 'بازنشانی نما',
    'tree.zoomIn': 'بزرگنمایی',
    'tree.zoomOut': 'کوچکنمایی',
    'tree.addPerson': 'افزودن فرد',
    'tree.editPerson': 'ویرایش فرد',
    'tree.deletePerson': 'حذف فرد',
    
    // Search
    'search.title': 'جستجو',
    'search.placeholder': 'جستجو بر اساس نام، مکان...',
    'search.noResults': 'نتیجه‌ای یافت نشد',
    'search.results': 'نتیجه',
    
    // Person
    'person.name': 'نام',
    'person.role': 'نقش',
    'person.location': 'مکان',
    'person.birthYear': 'سال تولد',
    'person.deathYear': 'سال فوت',
    'person.bio': 'بیوگرافی',
    'person.instagram': 'اینستاگرام',
    'person.children': 'فرزندان',
    'person.parent': 'والدین',
    'person.spouse': 'همسر',
    'person.gender': 'جنسیت',
    'person.male': 'مرد',
    'person.female': 'زن',
    
    // Admin
    'admin.title': 'پنل مدیریت',
    'admin.suggestions': 'پیشنهادات',
    'admin.users': 'کاربران',
    'admin.permissions': 'درخواست‌های دسترسی',
    'admin.identityClaims': 'ادعاهای هویت',
    'admin.populateTree': 'پر کردن شجره‌نامه',
    'admin.approve': 'تأیید',
    'admin.reject': 'رد',
    'admin.pending': 'در انتظار',
    'admin.approved': 'تأیید شده',
    'admin.rejected': 'رد شده',
    
    // Common
    'common.save': 'ذخیره',
    'common.cancel': 'انصراف',
    'common.delete': 'حذف',
    'common.edit': 'ویرایش',
    'common.add': 'افزودن',
    'common.close': 'بستن',
    'common.confirm': 'تأیید',
    'common.loading': 'در حال بارگذاری...',
    'common.error': 'خطا',
    'common.success': 'موفقیت',
    'common.yes': 'بله',
    'common.no': 'خیر',
    'common.back': 'بازگشت',
    'common.next': 'بعدی',
    'common.submit': 'ارسال',
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      setLanguageState(savedLanguage);
      document.documentElement.dir = LANGUAGES[savedLanguage].dir;
      document.documentElement.lang = savedLanguage;
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = LANGUAGES[lang].dir;
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations['en'][key] || key;
    
    // Replace parameters like {name} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(value));
      });
    }
    
    return text;
  }, [language]);

  const dir = LANGUAGES[language].dir;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Hook for components that may render before provider is mounted
export const useI18nSafe = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key: string) => key,
      dir: 'ltr',
    };
  }
  return context;
};
