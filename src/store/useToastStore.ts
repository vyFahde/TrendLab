import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type: 'success',

  showToast: (message, type = 'success') => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    set({ visible: true, message, type });

    toastTimer = setTimeout(() => {
      set({ visible: false });
    }, 3200);
  },

  hideToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    set({ visible: false });
  },
}));
