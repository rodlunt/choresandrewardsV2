import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateChild } from '@/hooks/use-app-data';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';

interface FirstRunPageProps {
  onComplete: () => void;
}

export default function FirstRunPage({ onComplete }: FirstRunPageProps) {
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
        title: "Welcome to Chores & Rewards!",
        description: `${name} has been added successfully`,
      });
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add child",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-brand-grayLight flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-coral to-brand-teal rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-brand-coral mb-2">Welcome to Chores</h1>
            <p className="text-brand-grayDark/70">Let's start by adding your first child</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="first-child-name" className="block text-sm font-medium text-brand-grayDark mb-2">
                Child's Name
              </Label>
              <Input
                id="first-child-name"
                type="text"
                placeholder="Enter name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                data-testid="input-first-child-name"
              />
            </div>
            <Button
              type="submit"
              disabled={createChild.isPending}
              className="w-full bg-brand-coral hover:bg-brand-coral/90"
              data-testid="button-add-first-child"
            >
              {createChild.isPending ? 'Adding...' : 'Get Started'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
