import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storage } from '@/lib/storage';
import { InsertChild, InsertChore, Settings, AppData, Child } from '@shared/schema';

export function useChildren() {
  return useQuery({
    queryKey: ['children'],
    queryFn: () => storage.getAllChildren(),
  });
}

export function useChild(id: string) {
  return useQuery({
    queryKey: ['children', id],
    queryFn: () => storage.getChild(id),
    enabled: !!id,
  });
}

export function useChores() {
  return useQuery({
    queryKey: ['chores'],
    queryFn: () => storage.getAllChores(),
  });
}

export function usePayouts() {
  return useQuery({
    queryKey: ['payouts'],
    queryFn: () => storage.getAllPayouts(),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => storage.getSettings(),
  });
}

export function useCreateChild() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertChild) => storage.createChild(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });
}

export function useUpdateChild() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Parameters<typeof storage.updateChild>[1]> }) => 
      storage.updateChild(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });
}

export function useDeleteChild() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => storage.deleteChild(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });
}

export function useCreateChore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertChore) => storage.createChore(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
    },
  });
}

export function useUpdateChore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Parameters<typeof storage.updateChore>[1]> }) => 
      storage.updateChore(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
    },
  });
}

export function useDeleteChore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => storage.deleteChore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
    },
  });
}

export function useCompleteChore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ childId, choreValueCents }: { childId: string; choreValueCents: number }) => 
      storage.completeChore(childId, choreValueCents),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });
}

export function usePayoutChild() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (childId: string) => storage.payoutChild(childId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Settings) => storage.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: () => storage.exportData(),
  });
}

export function useImportData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AppData) => storage.importData(data),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

// Favorite chores hooks (per-child)
export function useToggleFavoriteChore(childId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (choreId: string) => storage.toggleFavoriteChore(childId, choreId),
    onMutate: async (choreId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['children'] });
      await queryClient.cancelQueries({ queryKey: ['children', childId] });

      // Snapshot previous value
      const previousChildren = queryClient.getQueryData<Child[]>(['children']);
      const previousChild = queryClient.getQueryData<Child>(['children', childId]);

      // Optimistically update
      if (previousChildren) {
        queryClient.setQueryData<Child[]>(['children'], (old) =>
          old?.map(child => {
            if (child.id === childId) {
              const favoriteIds = child.favoriteChoreIds || [];
              const isFavorite = favoriteIds.includes(choreId);
              return {
                ...child,
                favoriteChoreIds: isFavorite
                  ? favoriteIds.filter(id => id !== choreId)
                  : [...favoriteIds, choreId]
              };
            }
            return child;
          }) || []
        );
      }

      if (previousChild) {
        queryClient.setQueryData<Child>(['children', childId], (old) => {
          if (!old) return old;
          const favoriteIds = old.favoriteChoreIds || [];
          const isFavorite = favoriteIds.includes(choreId);
          return {
            ...old,
            favoriteChoreIds: isFavorite
              ? favoriteIds.filter(id => id !== choreId)
              : [...favoriteIds, choreId]
          };
        });
      }

      return { previousChildren, previousChild };
    },
    onError: (err, choreId, context) => {
      // Rollback on error
      if (context?.previousChildren) {
        queryClient.setQueryData(['children'], context.previousChildren);
      }
      if (context?.previousChild) {
        queryClient.setQueryData(['children', childId], context.previousChild);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['children', childId] });
    },
  });
}

export function useIsChoreFavorite(childId: string, choreId: string): boolean {
  const { data: child } = useChild(childId);
  if (!child) return false;
  return (child.favoriteChoreIds || []).includes(choreId);
}

export function useFavoriteChores(childId: string) {
  const { data: child } = useChild(childId);
  const { data: allChores } = useChores();

  if (!child || !allChores) return [];

  const favoriteIds = child.favoriteChoreIds || [];
  return allChores.filter(chore => favoriteIds.includes(chore.id));
}
