export type NoticeType = 'error' | 'success' | 'info' | 'warning';

export interface NoticeItem {
  id: string;
  type: NoticeType;
  title: string;
  description?: string;
  duration?: number;
}

export interface NoticeContextValue {
  notices: NoticeItem[];
  notify: {
    error: (title: string, description?: string, duration?: number) => string;
    success: (title: string, description?: string, duration?: number) => string;
    info: (title: string, description?: string, duration?: number) => string;
    warning: (title: string, description?: string, duration?: number) => string;
    dismiss: (id: string) => void;
    clearAll: () => void;
  };
}
