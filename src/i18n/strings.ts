/**
 * UI text in both languages.
 *
 * Content — subjects, questions, packages, FAQs — is NOT here: the API already
 * returns every one of those with an `...En` and a `...Bn` field, and `pick()`
 * chooses between them. This file is only the app's own chrome, so the API
 * stays language-neutral and never has to know what the reader speaks.
 */
export const strings = {
  // ---- generic ----
  loading: { en: 'Loading…', bn: 'লোড হচ্ছে…' },
  retry: { en: 'Try again', bn: 'আবার চেষ্টা করুন' },
  cancel: { en: 'Cancel', bn: 'বাতিল' },
  save: { en: 'Save', bn: 'সংরক্ষণ' },
  back: { en: 'Back', bn: 'ফিরে যান' },
  done: { en: 'Done', bn: 'সম্পন্ন' },
  goBack: { en: 'Go Back', bn: 'ফিরে যান' },
  signIn: { en: 'Sign In', bn: 'সাইন ইন' },
  signOut: { en: 'Sign Out', bn: 'সাইন আউট' },

  // ---- tabs ----
  tabHome: { en: 'Home', bn: 'হোম' },
  tabExams: { en: 'Model Tests', bn: 'মডেল টেস্ট' },
  tabPractice: { en: 'Practice', bn: 'অনুশীলন' },
  tabBookmarks: { en: 'Saved', bn: 'সংরক্ষিত' },
  tabProfile: { en: 'Profile', bn: 'প্রোফাইল' },

  // ---- auth ----
  loginTitle: { en: 'Sign In', bn: 'সাইন ইন' },
  loginSubtitle: { en: 'Sign in to your account.', bn: 'আপনার অ্যাকাউন্টে প্রবেশ করুন।' },
  email: { en: 'Email Address', bn: 'ইমেইল ঠিকানা' },
  password: { en: 'Password', bn: 'পাসওয়ার্ড' },
  confirmPassword: { en: 'Confirm Password', bn: 'পাসওয়ার্ড নিশ্চিত করুন' },
  fullName: { en: 'Full Name', bn: 'পূর্ণ নাম' },
  phoneOptional: { en: 'Phone (optional)', bn: 'ফোন (ঐচ্ছিক)' },
  continueWithGoogle: { en: 'Continue with Google', bn: 'গুগল দিয়ে চালিয়ে যান' },
  createAccount: { en: 'Create Account', bn: 'অ্যাকাউন্ট তৈরি করুন' },
  noAccountYet: { en: 'New here?', bn: 'নতুন?' },
  alreadyHaveAccount: { en: 'Already have an account?', bn: 'আগে থেকেই অ্যাকাউন্ট আছে?' },
  registerSubtitle: {
    en: 'Your progress, results and bookmarks stay in one place.',
    bn: 'আপনার প্রস্তুতি, ফলাফল ও বুকমার্ক সব এক জায়গায় সংরক্ষিত থাকবে।',
  },
  passwordsDoNotMatch: { en: 'The two passwords do not match.', bn: 'পাসওয়ার্ড দুটি মিলছে না।' },
  passwordMinLength: { en: 'At least 6 characters', bn: 'কমপক্ষে ৬ অক্ষর' },
  enterValidEmail: { en: 'Please enter a valid email address.', bn: 'সঠিক ইমেইল ঠিকানা দিন।' },
  enterPassword: { en: 'Please enter your password.', bn: 'পাসওয়ার্ড দিন।' },
  enterName: { en: 'Please enter your name.', bn: 'আপনার নাম লিখুন।' },

  // ---- email verification ----
  verifyEmailTitle: { en: 'Verify your email', bn: 'ইমেইল যাচাই করুন' },
  verifyEmailSubtitle: {
    en: 'Enter the 6-digit code we sent to',
    bn: 'আমরা যে ৬ সংখ্যার কোড পাঠিয়েছি তা লিখুন',
  },
  verifyButton: { en: 'Verify', bn: 'যাচাই করুন' },
  resendCode: { en: 'Resend code', bn: 'আবার কোড পাঠান' },
  resendIn: { en: 'Resend in', bn: 'পুনরায় পাঠান' },
  didNotGetCode: { en: "Didn't get the code?", bn: 'কোড পাননি?' },
  checkAccountCreated: {
    en: 'We created your account. Check your inbox (and spam folder) for the code.',
    bn: 'আপনার একাউন্ট তৈরি হয়েছে। কোডের জন্য ইনবক্স (এবং স্প্যাম) দেখুন।',
  },
  enterSixDigitCode: { en: 'Please enter the 6-digit code.', bn: 'ছয় সংখ্যার কোডটি লিখুন।' },
  changeEmail: { en: 'Change email', bn: 'ইমেইল পরিবর্তন করুন' },

  // ---- exams / units ----
  selectUnit: { en: 'Select a unit', bn: 'ইউনিট নির্বাচন করুন' },
  whichUnit: { en: 'Which unit are you preparing for?', bn: 'কোন ইউনিটের প্রস্তুতি নিচ্ছেন?' },
  changeUnit: { en: 'Change unit', bn: 'ইউনিট বদলান' },
  subjects: { en: 'Subjects', bn: 'বিষয়সমূহ' },
  chapters: { en: 'Chapters', bn: 'অধ্যায়সমূহ' },
  questionPapers: { en: 'Question Papers', bn: 'প্রশ্নপত্র' },
  noQuestionsYet: { en: 'No questions added yet', bn: 'প্রশ্ন যোগ হয়নি' },
  noSubjectsYet: {
    en: 'No subjects added to this unit yet.',
    bn: 'এই ইউনিটে এখনো কোনো বিষয় যোগ করা হয়নি।',
  },
  noChaptersYet: {
    en: 'No chapters added to this subject yet.',
    bn: 'এই বিষয়ে এখনো কোনো অধ্যায় যোগ করা হয়নি।',
  },
  mcqs: { en: 'MCQs', bn: 'প্রশ্ন' },
  practiseThisSubject: { en: 'Practise this subject', bn: 'এই বিষয়ে অনুশীলন করুন' },

  // ---- practice ----
  practiceComplete: { en: 'Practice complete', bn: 'অনুশীলন শেষ' },
  practiceAgain: { en: 'Practice Again', bn: 'আবার অনুশীলন' },
  correct: { en: 'Correct', bn: 'সঠিক' },
  wrong: { en: 'Wrong', bn: 'ভুল' },
  skipped: { en: 'Skipped', bn: 'বাদ' },
  explanation: { en: 'Explanation', bn: 'ব্যাখ্যা' },
  correctAnswer: { en: 'Correct answer', bn: 'সঠিক উত্তর' },
  question: { en: 'Question', bn: 'প্রশ্ন' },
  next: { en: 'Next', bn: 'পরবর্তী' },
  skip: { en: 'Skip', bn: 'বাদ দিন' },
  finish: { en: 'Finish', bn: 'শেষ করুন' },

  // ---- bookmarks ----
  savedQuestions: { en: 'Saved Questions', bn: 'সংরক্ষিত প্রশ্ন' },
  noBookmarks: { en: 'No bookmarks saved', bn: 'কোনো বুকমার্ক নেই' },
  bookmarkHint: {
    en: 'Tap the bookmark icon on any question to keep it here.',
    bn: 'যেকোনো প্রশ্নে বুকমার্ক আইকনে চাপ দিয়ে এখানে রাখুন।',
  },
  removedFromBookmarks: { en: 'Removed from bookmarks.', bn: 'বুকমার্ক থেকে সরানো হয়েছে।' },
  savedToBookmarks: { en: 'Saved to bookmarks.', bn: 'বুকমার্কে সংরক্ষিত হয়েছে।' },

  // ---- subscription ----
  myProgress: { en: 'My progress', bn: 'আমার অগ্রগতি' },
  buyPackage: { en: 'Buy this exam package', bn: 'এই পরীক্ষার প্যাকেজ কিনুন' },
  signInToBuy: { en: 'Sign in to buy a package', bn: 'সাইন ইন করে প্যাকেজ কিনুন' },
  packageNeeded: {
    en: 'A package is needed to open the papers and model tests.',
    bn: 'প্রশ্নপত্র ও মডেল টেস্ট খুলতে প্যাকেজ প্রয়োজন।',
  },
  forWhichExam: { en: 'For which exam', bn: 'যে পরীক্ষার জন্য' },
  allExams: { en: 'All exams', bn: 'সব পরীক্ষা' },
  allUnits: { en: 'all units', bn: 'সব ইউনিট' },

  // ---- profile ----
  language: { en: 'Language', bn: 'ভাষা' },
  languageHint: {
    en: 'Changes the app text. Questions keep both languages.',
    bn: 'অ্যাপের লেখা বদলায়। প্রশ্ন দুই ভাষাতেই থাকে।',
  },
  faq: { en: 'Frequently Asked Questions', bn: 'সাধারণ জিজ্ঞাসা' },
  noFaqs: { en: 'No questions added yet.', bn: 'এখনো কোনো প্রশ্নোত্তর যোগ করা হয়নি।' },
  testsTaken: { en: 'Tests taken', bn: 'পরীক্ষা দেওয়া' },
  accuracy: { en: 'Accuracy', bn: 'নির্ভুলতা' },
  dayStreak: { en: 'Day streak', bn: 'ধারাবাহিকতা' },
  questionsSolved: { en: 'Questions solved', bn: 'সমাধান করা প্রশ্ন' },
} as const;

export type StringKey = keyof typeof strings;
