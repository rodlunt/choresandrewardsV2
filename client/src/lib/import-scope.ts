// Pure helpers for the import confirmation dialog (see SettingsPage). Kept
// separate from the page so the scope-naming and empty-database logic can be
// unit tested without rendering React.

export interface ImportScopeCounts {
  children: number;
  chores: number;
  payouts: number;
}

// The confirmation dialog (and the automatic pre-import backup) is only
// shown when there is existing data that an import would destroy. A brand
// new database is not "empty" in the loose sense the moment default chores
// have been seeded, but it has nothing a user would recognise as data worth
// naming yet, so we only skip the dialog when children, chores and payouts
// are all genuinely empty.
export function isDataEmpty(counts: ImportScopeCounts): boolean {
  return counts.children === 0 && counts.chores === 0 && counts.payouts === 0;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function describeImportScope(counts: ImportScopeCounts): string {
  return `Replace ${pluralize(counts.children, 'child', 'children')}, ${pluralize(counts.chores, 'chore', 'chores')} and ${pluralize(counts.payouts, 'payout', 'payouts')}?`;
}
