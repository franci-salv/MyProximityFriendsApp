import { Bell } from 'lucide-react';
import type { ToastState } from '../types/models';

interface ToastBannerProps {
  toast: ToastState | null;
}

export function ToastBanner({ toast }: ToastBannerProps) {
  if (!toast?.visible) return null;

  return (
    <div className="fixed left-1/2 top-4 z-50 w-[92%] max-w-lg -translate-x-1/2 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-100/95 to-orange-100/95 p-4 shadow-xl backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-200/70 p-2 text-amber-700">
          <Bell size={18} />
        </div>
        <p className="text-sm font-medium leading-relaxed text-amber-900">{toast.message}</p>
      </div>
    </div>
  );
}
