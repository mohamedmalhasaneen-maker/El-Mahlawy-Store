import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, X } from 'lucide-react';
import { STORE_INFO } from '../types/store';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPassword: (password: string) => Promise<boolean>;
}

export function AdminPasswordModal({
  isOpen,
  onClose,
  onSubmitPassword,
}: AdminPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setShowPassword(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور أولًا.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const ok = await onSubmitPassword(password);
      if (!ok) {
        setError('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-pass-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#081A33]/60 backdrop-blur-xs p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white border-t sm:border border-[#CBE7FA] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between gap-2.5 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt={STORE_INFO.storeName}
              className="h-11 w-11 shrink-0 rounded-2xl object-contain border border-[#CBE7FA] bg-[#F2FAFF] p-1"
            />
            <div className="min-w-0">
              <h2 id="admin-pass-title" className="text-base sm:text-lg font-extrabold text-[#0B1F3A] truncate">
                دخول لوحة الإدارة
              </h2>
              <p className="text-xs text-slate-500 truncate">
                أدخل كلمة المرور لفتح إدارة {STORE_INFO.storeName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة كلمة المرور"
            className="inline-flex min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] text-[#0B1F3A] hover:bg-[#E2F3FE] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-red-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-xs sm:text-sm font-bold text-[#0F294A] mb-1.5"
            >
              كلمة المرور
            </label>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="أدخل كلمة المرور..."
                dir="ltr"
                className="font-num w-full min-h-[46px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] pl-11 pr-4 py-2.5 text-base font-bold text-[#0B1F3A] text-right placeholder:font-sans placeholder:font-normal focus:bg-white focus:outline-2 focus:outline-[#1D4ED8]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                className="absolute left-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-[#1D4ED8] cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 px-5 py-2.5 text-sm font-extrabold text-white transition-colors cursor-pointer"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>دخول</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[#F2FAFF] hover:bg-[#E2F3FE] border border-[#CBE7FA] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#0F294A] transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
