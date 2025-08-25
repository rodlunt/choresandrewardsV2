import { useState } from 'react';
import { useChores, useDeleteChore, useUpdateChore } from '@/hooks/use-app-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import AddChoreDialog from '@/components/AddChoreDialog';
import { formatValue } from '@/lib/format';
import { Chore } from '@shared/schema';
import { Plus, Edit, Trash2, Star, ListTodo } from 'lucide-react';
import { useSettings } from '@/hooks/use-app-data';

export default function ChoresPage() {
  const [showAddChore, setShowAddChore] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | undefined>(undefined);
  
  const { data: chores, isLoading: choresLoading } = useChores();
  const { data: settings } = useSettings();
  const deleteChore = useDeleteChore();
  const updateChore = useUpdateChore();
  const { toast } = useToast();

  const formatValueDisplay = (cents: number) => {
    return formatValue(cents, settings?.displayMode);
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

  const handleToggleFavorite = async (chore: Chore) => {
    try {
      await updateChore.mutateAsync({
        id: chore.id,
        updates: { isFavorite: !chore.isFavorite }
      });
      toast({
        title: "Success",
        description: `"${chore.title}" ${chore.isFavorite ? 'removed from' : 'added to'} favorites`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const handleAddChore = () => {
    setEditingChore(undefined);
    setShowAddChore(true);
  };

  const handleCloseChoreDialog = () => {
    setShowAddChore(false);
    setEditingChore(undefined);
  };

  if (choresLoading) {
    return <LoadingSpinner className="min-h-[50vh]" />;
  }

  const favoriteChores = chores?.filter(c => c.isFavorite) || [];
  const regularChores = chores?.filter(c => !c.isFavorite) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-grayDark">Chore Management</h1>
          <p className="text-brand-grayDark/70 mt-1">Manage all family chores and mark favorites</p>
        </div>
        <Button
          onClick={handleAddChore}
          className="bg-brand-teal hover:bg-brand-teal/90 shadow-soft"
          data-testid="button-add-chore"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Chore
        </Button>
      </div>

      {/* Favorite Chores */}
      {favoriteChores.length > 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-brand-yellow" />
              <h2 className="text-xl font-semibold text-brand-grayDark">Favorite Chores</h2>
            </div>
            <div className="space-y-3">
              {favoriteChores.map((chore) => (
                <div key={chore.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-brand-grayLight transition-all" data-testid={`item-favorite-chore-${chore.id}`}>
                  <div className="w-10 h-10 bg-brand-yellow/20 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-brand-yellow" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-brand-grayDark" data-testid={`text-chore-title-${chore.id}`}>
                      {chore.title}
                    </h3>
                    <p className="text-brand-coral font-semibold text-sm" data-testid={`text-chore-value-${chore.id}`}>
                      {formatValueDisplay(chore.valueCents)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleFavorite(chore)}
                      className="text-brand-yellow hover:text-brand-yellow/80 hover:bg-brand-yellow/10"
                      data-testid={`button-unfavorite-chore-${chore.id}`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditChore(chore)}
                      className="text-brand-grayDark/60 hover:text-brand-grayDark hover:bg-brand-grayLight"
                      data-testid={`button-edit-chore-${chore.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteChore(chore.id, chore.title)}
                      className="text-brand-coral/60 hover:text-brand-coral hover:bg-brand-coral/10"
                      data-testid={`button-delete-chore-${chore.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Chores */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo className="w-5 h-5 text-brand-teal" />
            <h2 className="text-xl font-semibold text-brand-grayDark">All Chores</h2>
          </div>
          <div className="space-y-3">
            {regularChores.map((chore) => (
              <div key={chore.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-brand-grayLight transition-all" data-testid={`item-chore-${chore.id}`}>
                <div className="w-10 h-10 bg-brand-teal/20 rounded-lg flex items-center justify-center">
                  <ListTodo className="w-5 h-5 text-brand-teal" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-brand-grayDark" data-testid={`text-chore-title-${chore.id}`}>
                    {chore.title}
                  </h3>
                  <p className="text-brand-coral font-semibold text-sm" data-testid={`text-chore-value-${chore.id}`}>
                    {formatValueDisplay(chore.valueCents)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleFavorite(chore)}
                    className="text-brand-grayDark/40 hover:text-brand-yellow hover:bg-brand-yellow/10"
                    data-testid={`button-favorite-chore-${chore.id}`}
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditChore(chore)}
                    className="text-brand-grayDark/60 hover:text-brand-grayDark hover:bg-brand-grayLight"
                    data-testid={`button-edit-chore-${chore.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteChore(chore.id, chore.title)}
                    className="text-brand-coral/60 hover:text-brand-coral hover:bg-brand-coral/10"
                    data-testid={`button-delete-chore-${chore.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {regularChores.length === 0 && favoriteChores.length === 0 && (
              <p className="text-brand-grayDark/60 text-center py-8">No chores added yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <AddChoreDialog 
        open={showAddChore} 
        onOpenChange={handleCloseChoreDialog}
        existingChore={editingChore}
      />
    </div>
  );
}