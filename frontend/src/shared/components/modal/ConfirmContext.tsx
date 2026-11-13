'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import type { ConfirmDialogOptions, ConfirmContextValue, ConfirmFn } from './types';

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface ConfirmProviderProps {
  readonly children: React.ReactNode;
}

export function ConfirmProvider({ children }: Readonly<ConfirmProviderProps>) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm: ConfirmFn = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
    // If a previous dialog is already pending, resolve it false first
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }

    setOptions(opts);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  const contextValue = useMemo<ConfirmContextValue>(
    () => ({
      confirm,
    }),
    [confirm]
  );

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
      <ConfirmDialog
        isOpen={isOpen}
        options={options}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}
