import { useState } from 'react';
import { useLocation } from 'wouter';
import { useChild, useChores, useCompleteChore, useDeleteChore, useSettings } from '@/hooks/use-app-data';
import { useFeedback } from '@/hooks/use-feedback';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import PayoutDialog from '@/components/PayoutDialog';
import AddChoreDialog from '@/components/AddChoreDialog';
import { formatValue } from '@/lib/format';
import { ArrowLeft, Check, DollarSign, Edit, Trash2, Plus } from 'lucide-react';
import { Chore } from '@shared/schema';

interface ChildChoresPageProps {
  childId: string;
}

export default function ChildChoresPage({ childId }: ChildChoresPageProps) {
  const [, setLocation] = useLocation();
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [showAddChore, setShowAddChore] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | undefined>(undefined);
  
  const { data: child, isLoading: childLoading } = useChild(childId);
  const { data: chores, isLoading: choresLoading } = useChores();
  const { data: settings } = useSettings();
  const completeChore = useCompleteChore();
  const deleteChore = useDeleteChore();
  const { choreFeedback } = useFeedback();
  const { toast } = useToast();

  const isLoading = childLoading || choresLoading;

  const formatValueDisplay = (cents: number) => {
    return formatValue(cents, settings?.displayMode);
  };

  const getChildInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleCompleteChore = async (choreId: string, choreTitle: string, choreValueCents: number) => {
    if (!child) return;

    try {
      await completeChore.mutateAsync({ childId: child.id, choreValueCents });
      await choreFeedback();
      
      toast({
        title: "🎉 Great job!",
        description: `${choreTitle} completed! +${formatValueDisplay(choreValueCents)}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete chore",
        variant: "destructive",
      });
    }
  };

  const handleEditChore = (chore: Chore) => {
    setEditingChore(chore);
    setShowAddChore(true);
  };

  const handleDeleteChore = async (choreId: string, choreTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${choreTitle}"?`)) {
      return;
    }

    try {
      await deleteChore.mutateAsync(choreId);
      toast({
        title: "Success",
        description: `"${choreTitle}" has been deleted`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chore",
        variant: "destructive",
      });
    }
  };

  const handleAddChore = () => {
    setEditingChore(undefined);
    setShowAddChore(true);
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-[50vh]" />;
  }

  if (!child) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-brand-grayDark mb-4">Child not found</h1>
        <Button onClick={() => setLocation('/')} className="bg-brand-coral hover:bg-brand-coral/90">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="p-2 hover:bg-white rounded-lg"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 text-brand-grayDark" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-teal to-brand-sky rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg" data-testid="text-child-initials">
              {getChildInitials(child.name)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-grayDark" data-testid="text-child-name">
              {child.name}'s Chores
            </h1>
            <p className="text-brand-grayDark/70" data-testid="text-child-total">
              {formatValueDisplay(child.totalCents)} earned
            </p>
          </div>
        </div>
      </div>

      {/* Add New Chore Button */}
      <div className="mb-4">
        <Button
          onClick={handleAddChore}
          className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-grayDark w-full py-4 shadow-soft"
          data-testid="button-add-chore"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Chore
        </Button>
      </div>

      {/* Chores List */}
      <div className="space-y-3">
        {chores?.map((chore) => (
          <Card key={chore.id} className="shadow-soft" data-testid={`card-chore-${chore.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-brand-grayDark" data-testid={`text-chore-title-${chore.id}`}>
                    {chore.title}
                  </h3>
                  <p className="text-brand-coral font-semibold" data-testid={`text-chore-value-${chore.id}`}>
                    {formatValueDisplay(chore.valueCents)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleEditChore(chore)}
                    variant="outline"
                    size="sm"
                    className="p-2 hover:bg-brand-grayLight"
                    data-testid={`button-edit-chore-${chore.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteChore(chore.id, chore.title)}
                    variant="outline"
                    size="sm"
                    className="p-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                    data-testid={`button-delete-chore-${chore.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleCompleteChore(chore.id, chore.title, chore.valueCents)}
                    disabled={completeChore.isPending}
                    className="bg-brand-teal hover:bg-brand-teal/90 shadow-soft px-4 py-2"
                    data-testid={`button-complete-chore-${chore.id}`}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {chores?.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-brand-grayLight rounded-xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-brand-grayDark/40" />
            </div>
            <h3 className="text-lg font-semibold text-brand-grayDark mb-2">No Chores Available</h3>
            <p className="text-brand-grayDark/60 mb-4">Tap the "Add New Chore" button above to create your first chore!</p>
          </CardContent>
        </Card>
      )}

      {/* Payout Section */}
      {child.totalCents > 0 && (
        <Card className="bg-gradient-to-r from-brand-coral to-brand-teal text-white shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Ready for Payout</h3>
                <p className="text-white/90 text-sm mt-1">Tap to pay out and reset total</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" data-testid="text-payout-amount">
                  {formatValueDisplay(child.totalCents)}
                </div>
                <Button
                  onClick={() => setShowPayoutDialog(true)}
                  className="bg-white text-brand-coral px-6 py-2 rounded-xl font-medium mt-2 hover:bg-white/90"
                  data-testid="button-payout"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Pay Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <PayoutDialog 
        open={showPayoutDialog} 
        onOpenChange={setShowPayoutDialog}
        child={child}
      />

      <AddChoreDialog 
        open={showAddChore} 
        onOpenChange={setShowAddChore}
        existingChore={editingChore}
      />
    </div>
  );
}
