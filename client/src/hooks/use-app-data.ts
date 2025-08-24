import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storage } from '@/lib/storage';
import { InsertChild, InsertChore, Settings, AppData } from '@shared/schema';

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
