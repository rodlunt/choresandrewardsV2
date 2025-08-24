import { usePayouts, useSettings } from '@/hooks/use-app-data';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatValue } from '@/lib/format';
import { CheckCircle, History } from 'lucide-react';
import { format } from 'date-fns';

export default function HistoryPage() {
  const { data: payouts, isLoading } = usePayouts();
  const { data: settings } = useSettings();

  const formatValueDisplay = (cents: number) => {
    return formatValue(cents, settings?.displayMode);
  };

  const getChildInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      'from-brand-teal to-brand-sky',
      'from-brand-coral to-brand-yellow',
      'from-brand-sky to-brand-teal',
      'from-brand-yellow to-brand-coral',
    ];
    return gradients[index % gradients.length];
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (days === 1) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else if (days < 7) {
      return `${days} days ago, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-grayDark">Payout History</h1>
        <p className="text-brand-grayDark/70 mt-1">Track all completed payouts</p>
      </div>

      {/* Payout History List */}
      <div className="space-y-4">
        {payouts?.map((payout, index) => (
          <Card key={payout.id} className="shadow-soft" data-testid={`card-payout-${payout.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${getGradientClass(index)} rounded-lg flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm" data-testid={`text-payout-initials-${payout.id}`}>
                      {getChildInitials(payout.childName)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-brand-grayDark" data-testid={`text-payout-child-${payout.id}`}>
                      {payout.childName}
                    </h3>
                    <p className="text-brand-grayDark/60 text-sm" data-testid={`text-payout-date-${payout.id}`}>
                      {formatDate(payout.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-brand-coral" data-testid={`text-payout-amount-${payout.id}`}>
                    {formatValueDisplay(payout.amountCents)}
                  </div>
                  <div className="flex items-center gap-1 text-brand-teal text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Paid</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {payouts?.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-brand-grayLight rounded-xl flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-brand-grayDark/40" />
            </div>
            <h3 className="text-lg font-semibold text-brand-grayDark mb-2">No Payouts Yet</h3>
            <p className="text-brand-grayDark/60">Complete some chores and make your first payout!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
