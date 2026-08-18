import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings, useUpdateSettings } from '@/hooks/use-app-data';
import { useToast } from '@/hooks/use-toast';
import { generateSalt, hashPin, verifyPin } from '@/lib/pin';

interface PinSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PIN_PATTERN = /^\d{4,6}$/;

// Set, change or remove the parent PIN from SettingsPage. Changing or
// removing an existing PIN requires re-entering the current one first;
// setting a fresh PIN (none configured yet) skips straight to the new-PIN
// fields.
export default function PinSetupDialog({ open, onOpenChange }: PinSetupDialogProps) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const hasPin = !!(settings?.pinHash && settings?.pinSalt);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      setBusy(false);
    }
  }, [open]);

  const currentPinIsCorrect = async (): Promise<boolean> => {
    if (!hasPin) return true;
    if (!settings?.pinHash || !settings?.pinSalt) return true;
    return verifyPin(currentPin, settings.pinSalt, settings.pinHash);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!(await currentPinIsCorrect())) {
      setError('Current PIN is incorrect');
      return;
    }

    if (!PIN_PATTERN.test(newPin)) {
      setError('PIN must be 4 to 6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setBusy(true);
    try {
      const salt = generateSalt();
      const pinHash = await hashPin(newPin, salt);
      await updateSettings.mutateAsync({ ...settings!, pinHash, pinSalt: salt });
      toast({ title: "Success", description: hasPin ? "PIN updated" : "Parent PIN set" });
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to save the PIN", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setError('');
    if (!(await currentPinIsCorrect())) {
      setError('Current PIN is incorrect');
      return;
    }

    setBusy(true);
    try {
      const { pinHash: _pinHash, pinSalt: _pinSalt, ...withoutPin } = settings!;
      await updateSettings.mutateAsync(withoutPin);
      toast({ title: "Success", description: "PIN removed" });
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to remove the PIN", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-brand-grayDark">
            {hasPin ? 'Change Parent PIN' : 'Set Parent PIN'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          {hasPin && (
            <div>
              <Label htmlFor="pin-setup-current" className="block text-sm font-medium text-brand-grayDark mb-2">
                Current PIN
              </Label>
              <Input
                id="pin-setup-current"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                className="w-full"
                data-testid="input-pin-current"
              />
            </div>
          )}
          <div>
            <Label htmlFor="pin-setup-new" className="block text-sm font-medium text-brand-grayDark mb-2">
              New PIN (4-6 digits)
            </Label>
            <Input
              id="pin-setup-new"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full"
              data-testid="input-pin-new"
            />
          </div>
          <div>
            <Label htmlFor="pin-setup-confirm" className="block text-sm font-medium text-brand-grayDark mb-2">
              Confirm New PIN
            </Label>
            <Input
              id="pin-setup-confirm"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full"
              data-testid="input-pin-confirm"
            />
          </div>
          {error && (
            <p className="text-brand-coral text-sm" data-testid="text-pin-setup-error">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-pin-setup"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="flex-1 bg-brand-teal hover:bg-brand-teal/90"
              data-testid="button-save-pin"
            >
              {busy ? 'Saving...' : (hasPin ? 'Update PIN' : 'Set PIN')}
            </Button>
          </div>
          {hasPin && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemove}
              disabled={busy}
              className="w-full text-brand-coral/70 hover:text-brand-coral hover:bg-brand-coral/10"
              data-testid="button-remove-pin"
            >
              Remove PIN
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
