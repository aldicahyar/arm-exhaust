export type NoticeType = 'error' | 'success' | 'info' | 'warning';

export interface NoticeActionButton {
  readonly label: string;
  readonly onClick: () => void;
}

export interface NoticeOptions {
  duration?: number;
  source?: string;
  action?: string;
  detail?: string;
  actionButton?: NoticeActionButton;
}

export interface NoticeItem {
  id: string;
  traceId: string;
  type: NoticeType;
  title: string;
  description?: string;
  duration?: number;
  timestamp: number;
  source?: string;
  action?: string;
  detail?: string;
  read?: boolean;
  actionButton?: NoticeActionButton;
}

export type NotifyFn = (
  title: string,
  description?: string,
  durationOrOptions?: number | NoticeOptions
) => string;

export interface NoticeContextValue {
  notices: NoticeItem[];
  history: NoticeItem[];
  unreadTraceCount: number;
  notify: {
    error: NotifyFn;
    success: NotifyFn;
    info: NotifyFn;
    warning: NotifyFn;
    dismiss: (id: string) => void;
    clearAll: () => void;
  };
  markAllHistoryRead: () => void;
  clearHistory: () => void;
}
