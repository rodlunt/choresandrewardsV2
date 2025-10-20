import { useState } from 'react';
import { useChildren, useChores, usePayouts, useSettings } from '@/hooks/use-app-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import AddChildDialog from '@/components/AddChildDialog';
import PWAInstallButton from '@/components/PWAInstallButton';
import { formatValue } from '@/lib/format';
import { Link } from 'wouter';
import { Plus, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const [showAddChild, setShowAddChild] = useState(false);
  const { data: children, isLoading: childrenLoading } = useChildren();
  const { data: chores, isLoading: choresLoading } = useChores();
  const { data: payouts, isLoading: payoutsLoading } = usePayouts();
  const { data: settings } = useSettings();

  const isLoading = childrenLoading || choresLoading || payoutsLoading;

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

  // Calculate stats
  const thisWeekPayouts = payouts?.filter(p => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    // Defensive: ensure createdAt is a Date object (handles string dates from JSON import)
    const payoutDate = p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt);
    return payoutDate >= weekAgo;
  }) || [];

  const totalEarned = children?.reduce((sum, child) => sum + child.totalCents, 0) || 0;
  const totalPayouts = thisWeekPayouts.length;

  if (isLoading) {
    return <LoadingSpinner className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-grayDark">Family Dashboard</h1>
          <p className="text-brand-grayDark/70 mt-1">Track chores and rewards for your family</p>
        </div>
        <div className="flex gap-3 ml-auto">
          <PWAInstallButton />
          <Button
            onClick={() => setShowAddChild(true)}
            className="bg-brand-coral hover:bg-brand-coral/90 shadow-soft"
            data-testid="button-add-child"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Child
          </Button>
        </div>
      </div>

      {/* Children Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children?.map((child, index) => {
          const completedChores = Math.floor(child.totalCents / 100); // Rough estimate
          const progressPercent = Math.min((child.totalCents / 1000) * 100, 100); // Progress to $10

          return (
            <Link key={child.id} href={`/child/${child.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1" data-testid={`card-child-${child.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getGradientClass(index)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-lg" data-testid={`text-child-initials-${child.id}`}>
                        {getChildInitials(child.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-brand-grayDark text-lg" data-testid={`text-child-name-${child.id}`}>
                        {child.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-brand-coral" data-testid={`text-child-total-${child.id}`}>
                          {formatValueDisplay(child.totalCents)}
                        </span>
                        <span className="text-sm text-brand-grayDark/60">earned</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <div className="flex-1 bg-brand-grayLight rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-brand-teal to-brand-yellow h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-brand-grayDark/60" data-testid={`text-child-progress-${child.id}`}>
                          {completedChores} done
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20"
                      data-testid={`button-view-chores-${child.id}`}
                    >
                      View Chores
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-brand-grayDark mb-4">This Week</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-brand-teal/10 rounded-xl mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-brand-teal" />
              </div>
              <div className="text-2xl font-bold text-brand-teal" data-testid="text-completed-chores">
                {children?.length || 0}
              </div>
              <div className="text-sm text-brand-grayDark/60">Active Kids</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-brand-coral/10 rounded-xl mx-auto mb-2">
                <DollarSign className="w-6 h-6 text-brand-coral" />
              </div>
              <div className="text-2xl font-bold text-brand-coral" data-testid="text-total-earned">
                {formatValueDisplay(totalEarned)}
              </div>
              <div className="text-sm text-brand-grayDark/60">Total Earned</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-brand-yellow/10 rounded-xl mx-auto mb-2">
                <Users className="w-6 h-6 text-brand-yellow" />
              </div>
              <div className="text-2xl font-bold text-brand-yellow" data-testid="text-payouts">
                {totalPayouts}
              </div>
              <div className="text-sm text-brand-grayDark/60">Payouts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {children?.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-brand-grayLight rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-brand-grayDark/40" />
            </div>
            <h3 className="text-lg font-semibold text-brand-grayDark mb-2">No Children Added Yet</h3>
            <p className="text-brand-grayDark/60 mb-4">Add your first child to start tracking chores and rewards!</p>
            <Button 
              onClick={() => setShowAddChild(true)}
              className="bg-brand-coral hover:bg-brand-coral/90"
              data-testid="button-add-first-child-empty"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Child
            </Button>
          </CardContent>
        </Card>
      )}

      <AddChildDialog open={showAddChild} onOpenChange={setShowAddChild} />
    </div>
  );
}
