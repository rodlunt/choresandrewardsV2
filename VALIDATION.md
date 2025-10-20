# Pre-Deployment Validation Guide

This guide explains how to thoroughly check for bugs before deploying.

## Automated Checks (GitHub Actions)

The `.github/workflows/validate-and-deploy.yml` workflow now includes:

1. **TypeScript Type Check** - Catches type errors
2. **Production Build Test** - Ensures the app builds successfully
3. **React Hook Validation** - Checks for common hook violations
4. **Build Output Validation** - Verifies all required files exist
5. **Artifact Upload** - Saves build for inspection

## Manual Validation Before Pushing

### Option 1: Run Validation Script (Linux/Mac/Git Bash)

```bash
bash validate.sh
```

### Option 2: Manual Commands (Windows/PowerShell)

```powershell
# 1. Type check
npm run check

# 2. Build test
npm run build

# 3. Verify build output exists
Test-Path dist/public/index.html
```

## Common React 19 Issues to Check

### ❌ Hooks After Conditional Returns

**WRONG:**
```typescript
function Component() {
  if (isLoading) return <Spinner />  // ❌ Early return

  const data = useMemo(...)  // ❌ Hook after return
}
```

**CORRECT:**
```typescript
function Component() {
  const data = useMemo(...)  // ✅ Hook first

  if (isLoading) return <Spinner />  // ✅ Return after hooks
}
```

### ❌ Hooks in Conditionals

**WRONG:**
```typescript
function Component({ showFeature }) {
  if (showFeature) {
    const [value, setValue] = useState(0)  // ❌ Conditional hook
  }
}
```

**CORRECT:**
```typescript
function Component({ showFeature }) {
  const [value, setValue] = useState(0)  // ✅ Always called

  if (!showFeature) return null
}
```

### ❌ Hooks in Loops

**WRONG:**
```typescript
items.map(item => {
  const value = useCallback(...)  // ❌ Hook in loop
})
```

**CORRECT:**
```typescript
const handleItem = useCallback(...)  // ✅ Hook outside loop

items.map(item => {
  return <Item onClick={() => handleItem(item)} />
})
```

## Build Verification Checklist

Before pushing to production:

- [ ] `npm run check` passes with no TypeScript errors
- [ ] `npm run build` completes successfully
- [ ] `dist/public/index.html` exists
- [ ] No hooks called after conditional returns
- [ ] No hooks called in conditionals (if/for/while)
- [ ] All `useMemo` dependencies are stable

## GitHub Actions Validation

Every push to `main` now runs validation checks **before** deployment.

If validation fails:
1. Check the GitHub Actions log
2. Fix the reported issues
3. Push again

## Testing the Build Locally

Since UNC paths cause issues on Windows, you can test using GitHub Actions artifacts:

1. Go to your repository → Actions
2. Find the latest successful workflow run
3. Download the "build-output" artifact
4. Inspect the built files

## React Error Reference

- **Error #310**: "Rendered more hooks than previous render"
  - **Cause**: Hooks called conditionally or after returns
  - **Fix**: Move all hooks to top of component

- **Error #311**: "Rendered fewer hooks than previous render"
  - **Cause**: Hooks skipped due to conditional logic
  - **Fix**: Ensure all hooks always execute

## Quick Debug Commands

```bash
# View recent commits
git log --oneline -5

# Check for hooks after returns in a file
grep -A 20 "if.*return" client/src/pages/ChildChoresPage.tsx | grep "use[A-Z]"

# Check TypeScript errors
npm run check 2>&1 | grep error

# Build and check output size
npm run build && du -sh dist/public
```

## When Something Breaks in Production

1. **Check GitHub Actions logs** - See if validation caught anything
2. **Check Docker logs** - `docker logs chores-rewards-app --tail 100`
3. **Check browser console** - F12 → Console tab
4. **Rollback if needed** - Revert to last known good commit

## Recommended: Add Pre-Commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "Running pre-commit validation..."
npm run check || exit 1
echo "✅ Pre-commit checks passed"
```

Make it executable: `chmod +x .git/hooks/pre-commit`
