import { useState } from 'react';
import { useChildren, useChores, useSettings, useDeleteChild, useDeleteChore, useUpdateSettings, useExportData, useImportData } from '@/hooks/use-app-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import AddChildDialog from '@/components/AddChildDialog';
import AddChoreDialog from '@/components/AddChoreDialog';
import { Chore } from '@shared/schema';
import { Plus, Edit2, Trash2, Download, Upload, Users, ListTodo } from 'lucide-react';

export default function SettingsPage() {
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddChore, setShowAddChore] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | undefined>();
  
  const { data: children, isLoading: childrenLoading } = useChildren();
  const { data: chores, isLoading: choresLoading } = useChores();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  
  const deleteChild = useDeleteChild();
  const deleteChore = useDeleteChore();
  const updateSettings = useUpdateSettings();
  const exportData = useExportData();
  const importData = useImportData();
  
  const { toast } = useToast();

  const isLoading = childrenLoading || choresLoading || settingsLoading;

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
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

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (!confirm(`Are you sure you want to delete ${childName}? This will also delete all their payout history.`)) {
      return;
    }

    try {
      await deleteChild.mutateAsync(childId);
      toast({
        title: "Success",
        description: `${childName} has been deleted`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete child",
        variant: "destructive",
      });
    }
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

  const handleEditChore = (chore: Chore) => {
    setEditingChore(chore);
    setShowAddChore(true);
  };

  const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
    if (!settings) return;

    try {
      await updateSettings.mutateAsync({ ...settings, [key]: value });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportData.mutateAsync();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chores-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        await importData.mutateAsync(data);
        
        toast({
          title: "Import Complete",
          description: "Your data has been imported successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    
    input.click();
  };

  const handleCloseChoreDialog = () => {
    setShowAddChore(false);
    setEditingChore(undefined);
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-grayDark">Settings</h1>
        <p className="text-brand-grayDark/70 mt-1">Manage children, chores, and app preferences</p>
      </div>

      {/* Children Management */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-coral" />
              <h2 className="text-xl font-semibold text-brand-grayDark">Children</h2>
            </div>
            <Button
              onClick={() => setShowAddChild(true)}
              size="sm"
              className="bg-brand-coral hover:bg-brand-coral/90 shadow-soft"
              data-testid="button-add-child-settings"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Child
            </Button>
          </div>
          <div className="space-y-3">
            {children?.map((child, index) => (
              <div key={child.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-brand-grayLight transition-all" data-testid={`item-child-${child.id}`}>
                <div className={`w-10 h-10 bg-gradient-to-br ${getGradientClass(index)} rounded-lg flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">
                    {getChildInitials(child.name)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-brand-grayDark" data-testid={`text-child-name-${child.id}`}>
                    {child.name}
                  </h3>
                  <p className="text-brand-grayDark/60 text-sm">
                    Current balance: {formatCurrency(child.totalCents)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteChild(child.id, child.name)}
                    className="text-brand-coral/60 hover:text-brand-coral hover:bg-brand-coral/10"
                    data-testid={`button-delete-child-${child.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {children?.length === 0 && (
              <p className="text-brand-grayDark/60 text-center py-4">No children added yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chores Management */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-brand-teal" />
              <h2 className="text-xl font-semibold text-brand-grayDark">Chores</h2>
            </div>
            <Button
              onClick={() => setShowAddChore(true)}
              size="sm"
              className="bg-brand-teal hover:bg-brand-teal/90 shadow-soft"
              data-testid="button-add-chore-settings"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Chore
            </Button>
          </div>
          <div className="space-y-3">
            {chores?.map((chore) => (
              <div key={chore.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-brand-grayLight transition-all" data-testid={`item-chore-${chore.id}`}>
                <div className="w-10 h-10 bg-brand-teal/20 rounded-lg flex items-center justify-center">
                  <ListTodo className="w-5 h-5 text-brand-teal" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-brand-grayDark" data-testid={`text-chore-title-${chore.id}`}>
                    {chore.title}
                  </h3>
                  <p className="text-brand-coral font-semibold text-sm" data-testid={`text-chore-value-${chore.id}`}>
                    {formatCurrency(chore.valueCents)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditChore(chore)}
                    className="text-brand-grayDark/60 hover:text-brand-grayDark hover:bg-brand-grayLight"
                    data-testid={`button-edit-chore-${chore.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
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
            {chores?.length === 0 && (
              <p className="text-brand-grayDark/60 text-center py-4">No chores added yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Settings */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-brand-grayDark mb-4">Feedback</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-brand-grayDark">Sound Effects</h3>
                <p className="text-brand-grayDark/60 text-sm">Play sounds when completing chores</p>
              </div>
              <Switch
                checked={settings?.sounds || false}
                onCheckedChange={(checked) => handleSettingChange('sounds', checked)}
                data-testid="switch-sounds"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-brand-grayDark">Haptic Feedback</h3>
                <p className="text-brand-grayDark/60 text-sm">Vibrate on task completion</p>
              </div>
              <Switch
                checked={settings?.haptics || false}
                onCheckedChange={(checked) => handleSettingChange('haptics', checked)}
                data-testid="switch-haptics"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-brand-grayDark">Confetti</h3>
                <p className="text-brand-grayDark/60 text-sm">Show celebration effects for payouts</p>
              </div>
              <Switch
                checked={settings?.confetti || false}
                onCheckedChange={(checked) => handleSettingChange('confetti', checked)}
                data-testid="switch-confetti"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-brand-grayDark mb-4">Data Management</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              onClick={handleExport}
              disabled={exportData.isPending}
              className="bg-brand-sky hover:bg-brand-sky/90 shadow-soft"
              data-testid="button-export-data"
            >
              <Download className="w-4 h-4 mr-2" />
              {exportData.isPending ? 'Exporting...' : 'Export Backup'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={importData.isPending}
              className="bg-brand-yellow hover:bg-brand-yellow/90 shadow-soft"
              data-testid="button-import-data"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importData.isPending ? 'Importing...' : 'Import Backup'}
            </Button>
          </div>
          <p className="text-brand-grayDark/60 text-sm mt-3 text-center">
            Export your data to keep it safe, or restore from a previous backup
          </p>
        </CardContent>
      </Card>

      <AddChildDialog open={showAddChild} onOpenChange={setShowAddChild} />
      <AddChoreDialog 
        open={showAddChore} 
        onOpenChange={handleCloseChoreDialog}
        existingChore={editingChore}
      />
    </div>
  );
}
