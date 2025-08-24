import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateChild } from '@/hooks/use-app-data';
import { useToast } from '@/hooks/use-toast';

interface AddChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddChildDialog({ open, onOpenChange }: AddChildDialogProps) {
  const [name, setName] = useState('');
  const createChild = useCreateChild();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a child's name",
        variant: "destructive",
      });
      return;
    }

    try {
      await createChild.mutateAsync({ name: name.trim() });
      toast({
        title: "Success!",
        description: `${name} has been added`,
      });
      setName('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add child",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-brand-grayDark">Add New Child</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="child-name" className="block text-sm font-medium text-brand-grayDark mb-2">
              Child's Name
            </Label>
            <Input
              id="child-name"
              type="text"
              placeholder="Enter name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              data-testid="input-child-name"
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-add-child"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createChild.isPending}
              className="flex-1 bg-brand-coral hover:bg-brand-coral/90"
              data-testid="button-confirm-add-child"
            >
              {createChild.isPending ? 'Adding...' : 'Add Child'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
