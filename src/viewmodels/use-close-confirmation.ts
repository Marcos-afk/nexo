import { useState } from "react";

interface UseCloseConfirmationProps {
  readonly needsConfirmation: boolean;
  readonly onClose: () => void;
}

export function useCloseConfirmation({ needsConfirmation, onClose }: UseCloseConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  return {
    isConfirming,
    onCloseClick: () => (needsConfirmation ? setIsConfirming(true) : onClose()),
    onCancel: () => setIsConfirming(false),
  };
}
