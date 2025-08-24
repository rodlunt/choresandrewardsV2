import { Settings } from '@shared/schema';

export const formatValue = (cents: number, displayMode?: Settings['displayMode']): string => {
  if (displayMode === 'points') {
    return `${cents} ${cents === 1 ? 'point' : 'points'}`;
  }
  
  // Default to dollars
  return `$${(cents / 100).toFixed(2)}`;
};

export const formatCurrency = (cents: number) => {
  return `$${(cents / 100).toFixed(2)}`;
};

export const formatPoints = (points: number) => {
  return `${points} ${points === 1 ? 'point' : 'points'}`;
};