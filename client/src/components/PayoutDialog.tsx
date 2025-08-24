import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePayoutChild } from '@/hooks/use-app-data';
import { useFeedback } from '@/hooks/use-feedback';
import { useToast } from '@/hooks/use-toast';
import { Child } from '@shared/schema';
import { DollarSign } from 'lucide-react';

interface PayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child: Child | null;
}

export default function PayoutDialog({ open, onOpenChange, child }: PayoutDialogProps) {
  const payoutChild = usePayoutChild();
  const { payoutFeedback } = useFeedback();
  const { toast } = useToast();

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handlePayout = async () => {
    if (!child) return;

    try {
      await payoutChild.mutateAsync(child.id);
      await payoutFeedback();
      
      toast({
        title: "🎉 Payout Complete!",
        description: `${child.name} has been paid ${formatCurrency(child.totalCents)}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payout",
        variant: "destructive",
      });
    }
  };

  if (!child) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-coral to-brand-teal rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="text-white text-xl" />
            </div>
            <DialogTitle className="text-xl font-semibold text-brand-grayDark">
              Pay Out {formatCurrency(child.totalCents)}?
            </DialogTitle>
            <p className="text-brand-grayDark/70 mt-2">
              This will reset {child.name}'s total to $0.00 and add the payout to history.
            </p>
          </div>
        </DialogHeader>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            data-testid="button-cancel-payout"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayout}
            disabled={payoutChild.isPending}
            className="flex-1 bg-brand-coral hover:bg-brand-coral/90"
            data-testid="button-confirm-payout"
          >
            {payoutChild.isPending ? 'Processing...' : 'Pay Out'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
