import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  AUTHORIZED_DEVELOPER_EMAIL,
  AUTHORIZED_DEVELOPER_UID,
  FIREBASE_PROJECT_ID,
  User,
  isAuthorizedDeveloperUid,
  sendDeveloperPasswordReset,
  translateFirebaseAuthError,
} from '../../lib/firebase';
import { SiteConfig } from '../../utils/siteConfig';

interface AccountSettingsSectionProps {
  currentUser: User | null;
  siteConfig: SiteConfig;
  onRefreshAuth: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export function AccountSettingsSection({
  currentUser,
  siteConfig,
  onRefreshAuth,
  onLogout,
}: AccountSettingsSectionProps) {
  const [busyAction, setBusyAction] = useState<'refresh' | 'reset' | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const uidMatchesPrimary = isAuthorizedDeveloperUid(currentUser?.uid);

  const handleRefreshSession = async () => {
    setBusyAction('refresh');
    setFeedback(null);
    try {
      await onRefreshAuth();
      setFeedback({
        type: 'success',
        message: 'تم تحديث رمز جلسة المطور (ID Token) والتحقق من الصلاحيات بنجاح.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: translateFirebaseAuthError(err),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleSendPasswordReset = async () => {
    const email = currentUser?.email?.trim();
    if (!email) {
      setFeedback({
        type: 'error',
        message: 'لا يوجد بريد إلكتروني مرتبط بالجلسة الحالية لإرسال رابط استعادة كلمة المرور.',
      });
      return;
    }

    setBusyAction('reset');
    setFeedback(null);
    try {
      await sendDeveloperPasswordReset(email);
      setFeedback({
        type: 'success',
        message: `تم إرسال رابط آمن لتغيير كلمة المرور إلى ${email}. يرجى فحص صندوق الوارد.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: translateFirebaseAuthError(err),
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <section aria-labelledby="dev-account-heading" className="space-y-6">
      <div className="pb-4 border-b border-[#D4AF37]/25">
        <h2 id="dev-account-heading" className="text-xl sm:text-2xl font-extrabold text-white">
          إعدادات الحساب وتسجيل الخروج
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          تفاصيل هوية المطور الموثّقة عبر Firebase Authentication وإدارة أمان الجلسة وكلمة المرور.
        </p>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
              : 'bg-[#C62828]/15 border-[#C62828] text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[#EF5350] shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Identity & Verification Card */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/30 p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/50 text-[#D4AF37]">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              حساب المطور المصرح له بالإدارة
            </h3>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">
              {uidMatchesPrimary
                ? 'مطابق لمعرّف المطور المعتمد (UID Verified)'
                : 'حساب مسؤول موثّق عبر البريد المؤكد'}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10 text-xs sm:text-sm">
          <div className="rounded-xl bg-[#0B0B0B] border border-white/10 p-3.5 space-y-1">
            <dt className="text-xs text-gray-400">البريد الإلكتروني المسجّل</dt>
            <dd className="font-bold text-white break-all">
              <bdi>{currentUser?.email || AUTHORIZED_DEVELOPER_EMAIL}</bdi>
            </dd>
          </div>

          <div className="rounded-xl bg-[#0B0B0B] border border-white/10 p-3.5 space-y-1">
            <dt className="text-xs text-gray-400">معرّف Firebase Authentication UID الحالي</dt>
            <dd className="font-mono text-xs font-bold text-[#D4AF37] break-all tabular-nums">
              <bdi>{currentUser?.uid || '—'}</bdi>
            </dd>
          </div>

          <div className="rounded-xl bg-[#0B0B0B] border border-white/10 p-3.5 space-y-1">
            <dt className="text-xs text-gray-400">معرّف المطور المعتمد في قواعد الأمان</dt>
            <dd className="font-mono text-xs font-bold text-gray-200 break-all tabular-nums">
              <bdi>{AUTHORIZED_DEVELOPER_UID}</bdi>
            </dd>
          </div>

          <div className="rounded-xl bg-[#0B0B0B] border border-white/10 p-3.5 space-y-1">
            <dt className="text-xs text-gray-400">مشروع السحابة المرتبط (Firebase Project)</dt>
            <dd className="font-mono text-xs font-bold text-gray-200 break-all tabular-nums">
              <bdi>{FIREBASE_PROJECT_ID}</bdi>
              {siteConfig.updatedAt ? (
                <span className="block text-[11px] font-sans font-normal text-gray-400 mt-0.5">
                  آخر تحديث للإعدادات:{' '}
                  {new Date(siteConfig.updatedAt).toLocaleString('ar-EG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              ) : null}
            </dd>
          </div>
        </dl>

        {/* Session & Password Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={handleSendPasswordReset}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] disabled:opacity-50 border border-[#D4AF37]/50 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#D4AF37] whitespace-nowrap cursor-pointer"
          >
            {busyAction === 'reset' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Mail className="h-4 w-4" aria-hidden="true" />
            )}
            <span>إرسال رابط تغيير كلمة المرور للبريد</span>
          </button>

          <button
            type="button"
            disabled={busyAction !== null}
            onClick={handleRefreshSession}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] disabled:opacity-50 border border-white/15 px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-200 whitespace-nowrap cursor-pointer"
          >
            {busyAction === 'refresh' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            )}
            <span>تحديث حالة الجلسة</span>
          </button>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="inline-flex min-h-[46px] sm:mr-auto items-center justify-center gap-2 rounded-xl bg-[#C62828] hover:bg-red-800 border border-[#D4AF37]/70 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white whitespace-nowrap cursor-pointer"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>تسجيل الخروج الآمن</span>
          </button>
        </div>
      </div>

      {/* Security Architecture Summary (Only shown to authenticated developer) */}
      <div className="rounded-2xl bg-[#141414] border border-white/10 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[#D4AF37]">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          <span>ضوابط الحماية المفعّلة على حساب المطور</span>
        </div>
        <ul className="space-y-2 text-xs sm:text-sm text-gray-300 leading-relaxed list-disc pr-5">
          <li>
            تُفحص هوية الحساب فعليًا في قواعد <bdi className="text-[#D4AF37]">Firestore Security Rules</bdi>{' '}
            عبر مطابقة <bdi className="font-mono text-xs text-white">request.auth.uid</bdi> مع المعرّف
            المعتمد دون تخزين أي كلمة مرور في الكود الأمامي.
          </li>
          <li>
            إنشاء الحسابات العامة من الواجهة الأمامية أو تعديل مجموعة الصلاحيات{' '}
            <bdi className="font-mono text-xs text-white">/admins</bdi> مغلق نهائيًا لمنع أي زائر من
            منح نفسه صلاحيات الإدارة.
          </li>
          <li>
            عند تسجيل الخروج يتم إنهاء الجلسة ومسح بيانات النماذج المؤقتة فورًا وإعادة قفل اللوحة.
          </li>
        </ul>
      </div>
    </section>
  );
}
