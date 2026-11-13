export interface ConfirmDialogOptions {
  readonly title: string;
  readonly description: string;
  readonly itemPreview?: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly variant?: 'danger' | 'warning' | 'default';
}

export type ConfirmFn = (options: ConfirmDialogOptions) => Promise<boolean>;

export interface ConfirmContextValue {
  readonly confirm: ConfirmFn;
}
