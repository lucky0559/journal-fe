import { create } from 'zustand';

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<{ message: string; show(msg: string): void }>()((set) => ({
  message: '',
  show(msg) {
    set({ message: msg });
    clearTimeout(timer);
    timer = setTimeout(() => set({ message: '' }), 1900);
  },
}));
