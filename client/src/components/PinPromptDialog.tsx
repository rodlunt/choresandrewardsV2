import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyPin } from '@/lib/pin';

interface PinPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  pinHash?: string;
  pinSalt?: string;
}

// Reusable "enter the parent PIN to continue" gate, driven by
// hooks/use-pin-guard.ts. Rendered once per gated page; usePinGuard decides
// whether it needs to open at all.
export default function PinPromptDialog({ open, onOpenChange, onVerified, pinHash, pinSalt }: PinPromptDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (open) {
      setPin('');
      setError('');
      setChecking(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pinHash || !pinSalt) {
      // No PIN configured to check against; nothing should have opened this
      // dialog, but let the caller through rather than trap them.
      onVerified();
      return;
    }

    setChecking(true);
    const ok = await verifyPin(pin, pinSalt, pinHash);
    setChecking(false);

    if (ok) {
      onVerified();
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-brand-grayDark">Enter Parent PIN</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pin-prompt-input" className="block text-sm font-medium text-brand-grayDark mb-2">
              PIN
            </Label>
            <Input
              id="pin-prompt-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full"
              data-testid="input-pin-prompt"
            />
            {error && (
              <p className="text-brand-coral text-sm mt-2" data-testid="text-pin-prompt-error">
                {error}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-pin-prompt"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={checking || pin.length < 4}
              className="flex-1 bg-brand-teal hover:bg-brand-teal/90"
              data-testid="button-confirm-pin-prompt"
            >
              {checking ? 'Checking...' : 'Confirm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
