import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateChore, useUpdateChore, useSettings } from '@/hooks/use-app-data';
import { useToast } from '@/hooks/use-toast';
import { Chore } from '@shared/schema';

interface AddChoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingChore?: Chore;
}

export default function AddChoreDialog({ open, onOpenChange, existingChore }: AddChoreDialogProps) {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  
  const createChore = useCreateChore();
  const updateChore = useUpdateChore();
  const { data: settings } = useSettings();
  const { toast } = useToast();

  const isEditing = !!existingChore;
  const displayMode = settings?.displayMode || 'dollars';

  // Update form when existingChore changes or dialog opens
  useEffect(() => {
    if (open) {
      if (existingChore) {
        setTitle(existingChore.title);
        setValue(displayMode === 'dollars' ? (existingChore.valueCents / 100).toFixed(2) : existingChore.valueCents.toString());
      } else {
        setTitle('');
        setValue('');
      }
    }
  }, [open, existingChore, displayMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a chore title",
        variant: "destructive",
      });
      return;
    }

    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < (displayMode === 'dollars' ? 0.01 : 1)) {
      toast({
        title: "Error",
        description: `Please enter a valid amount (minimum ${displayMode === 'dollars' ? '$0.01' : '1 point'})`,
        variant: "destructive",
      });
      return;
    }

    const valueCents = displayMode === 'dollars' ? Math.round(parsedValue * 100) : Math.round(parsedValue);

    try {
      if (isEditing) {
        await updateChore.mutateAsync({ 
          id: existingChore.id, 
          updates: { title: title.trim(), valueCents } 
        });
        toast({
          title: "Success!",
          description: "Chore updated successfully",
        });
      } else {
        await createChore.mutateAsync({ title: title.trim(), valueCents });
        toast({
          title: "Success!",
          description: "Chore added successfully",
        });
      }
      
      setTitle('');
      setValue('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'add'} chore`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-brand-grayDark">
            {isEditing ? 'Edit Chore' : 'Add New Chore'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="chore-title" className="block text-sm font-medium text-brand-grayDark mb-2">
              Chore Title
            </Label>
            <Input
              id="chore-title"
              type="text"
              placeholder="e.g., Make bed, Do dishes..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
              data-testid="input-chore-title"
            />
          </div>
          <div>
            <Label htmlFor="chore-value" className="block text-sm font-medium text-brand-grayDark mb-2">
              Value ({displayMode === 'dollars' ? 'AUD' : 'Points'})
            </Label>
            <Input
              id="chore-value"
              type="number"
              step={displayMode === 'dollars' ? "0.01" : "1"}
              min={displayMode === 'dollars' ? "0.01" : "1"}
              placeholder={displayMode === 'dollars' ? "e.g., 2.50" : "e.g., 50"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full"
              data-testid="input-chore-value"
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-add-chore"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createChore.isPending || updateChore.isPending}
              className="flex-1 bg-brand-teal hover:bg-brand-teal/90"
              data-testid="button-confirm-add-chore"
            >
              {(createChore.isPending || updateChore.isPending) ? 'Saving...' : (isEditing ? 'Update' : 'Add Chore')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
