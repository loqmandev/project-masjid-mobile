import { useRef, useState, useCallback, useEffect } from 'react';
import type { BottomSheetMethods } from '@/components/ui/bottom-sheet/types';

export interface UseBottomSheetReturn {
  ref: React.RefObject<BottomSheetMethods | null>;
  isVisible: boolean;
  open: () => void;
  close: () => void;
  handleClose: () => void;
}

export function useBottomSheet(): UseBottomSheetReturn {
  const ref = useRef<BottomSheetMethods>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldOpen, setShouldOpen] = useState(false);

  const open = useCallback(() => {
    setIsVisible(true);
    setShouldOpen(true);
  }, []);

  const close = useCallback(() => {
    ref.current?.close();
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setShouldOpen(false);
  }, []);

  // Open the sheet when shouldOpen changes
  useEffect(() => {
    if (shouldOpen) {
      // Use requestAnimationFrame to ensure the ref is ready
      requestAnimationFrame(() => {
        ref.current?.snapToIndex(0);
      });
    }
  }, [shouldOpen]);

  return {
    ref,
    isVisible,
    open,
    close,
    handleClose,
  };
}
