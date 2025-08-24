import { useState } from 'react';
import { useChildren, usePayouts, useSettings } from '@/hooks/use-app-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import PayoutDialog from '@/components/PayoutDialog';
import { Child } from '@shared/schema';
import { formatValue } from '@/lib/format';
import { DollarSign, Users } from 'lucide-react';

export default function TotalsPage() {
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  
  const { data: children, isLoading: childrenLoading } = useChildren();
  const { data: payouts, isLoading: payoutsLoading } = usePayouts();
  const { data: settings } = useSettings();

  const isLoading = childrenLoading || payoutsLoading;

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

  const handlePayoutClick = (child: Child) => {
    setSelectedChild(child);
    setShowPayoutDialog(true);
  };

  const globalTotal = children?.reduce((sum, child) => sum + child.totalCents, 0) || 0;

  if (isLoading) {
    return <LoadingSpinner className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-grayDark">Totals Overview</h1>
        <p className="text-brand-grayDark/70 mt-1">Current earnings for all children</p>
      </div>

      {/* Global Total */}
      <Card className="bg-gradient-to-r from-brand-coral to-brand-teal text-white shadow-soft">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-xl mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white/90">Family Total</h2>
            <div className="text-4xl font-bold mt-2" data-testid="text-global-total">
              {formatValueDisplay(globalTotal)}
            </div>
            <p className="text-white/80 text-sm mt-1">Across all children</p>
          </div>
        </CardContent>
      </Card>

      {/* Individual Child Totals */}
      <div className="space-y-4">
        {children?.map((child, index) => {
          const childPayouts = payouts?.filter(p => p.childId === child.id) || [];
          const choreCount = Math.floor(child.totalCents / 100); // Rough estimate
          
          return (
            <Card key={child.id} className="shadow-soft" data-testid={`card-child-total-${child.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getGradientClass(index)} rounded-xl flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg" data-testid={`text-child-initials-${child.id}`}>
                        {getChildInitials(child.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-brand-grayDark text-lg" data-testid={`text-child-name-${child.id}`}>
                        {child.name}
                      </h3>
                      <p className="text-brand-grayDark/60 text-sm" data-testid={`text-child-chores-${child.id}`}>
                        {choreCount} chores completed • {childPayouts.length} total payouts
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-brand-coral" data-testid={`text-child-total-${child.id}`}>
                      {formatValueDisplay(child.totalCents)}
                    </div>
                    {child.totalCents > 0 && (
                      <Button
                        onClick={() => handlePayoutClick(child)}
                        size="sm"
                        className="bg-brand-coral text-white px-4 py-2 rounded-lg text-sm font-medium mt-2 hover:bg-brand-coral/90"
                        data-testid={`button-payout-child-${child.id}`}
                      >
                        Pay Out
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {children?.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-brand-grayLight rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-brand-grayDark/40" />
            </div>
            <h3 className="text-lg font-semibold text-brand-grayDark mb-2">No Children Added Yet</h3>
            <p className="text-brand-grayDark/60">Add children to start tracking their earnings!</p>
          </CardContent>
        </Card>
      )}

      <PayoutDialog 
        open={showPayoutDialog} 
        onOpenChange={setShowPayoutDialog}
        child={selectedChild}
      />
    </div>
  );
}
