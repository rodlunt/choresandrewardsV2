#!/bin/bash

# Pre-deployment validation script
# Run this before pushing to catch issues early

set -e

echo "🔍 Starting validation checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. TypeScript Type Check
echo "📝 Running TypeScript type check..."
if npm run check; then
    echo -e "${GREEN}✅ Type check passed${NC}"
else
    echo -e "${RED}❌ Type check failed${NC}"
    exit 1
fi
echo ""

# 2. Build Test
echo "🏗️  Testing production build..."
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# 3. Check for React Hook violations
echo "⚛️  Checking for React Hook violations..."

HOOK_VIOLATIONS=0

# Check for hooks after conditional returns
echo "  Checking for hooks after conditional returns..."
if grep -r "if.*return" client/src --include="*.tsx" --include="*.ts" -B 5 -A 20 | grep -E "^\s*(const|let).*=(.*use[A-Z]|.*useMemo|.*useEffect|.*useState|.*useCallback)" > /dev/null 2>&1; then
    echo -e "  ${YELLOW}⚠️  WARNING: Possible hooks after conditional returns${NC}"
    HOOK_VIOLATIONS=$((HOOK_VIOLATIONS + 1))
fi

# Check for hooks in conditionals
echo "  Checking for hooks in conditionals..."
if grep -r "if\s*(" client/src --include="*.tsx" --include="*.ts" -A 10 | grep -E "^\s*(const|let).*use[A-Z]" > /dev/null 2>&1; then
    echo -e "  ${YELLOW}⚠️  WARNING: Possible hooks in conditionals${NC}"
    HOOK_VIOLATIONS=$((HOOK_VIOLATIONS + 1))
fi

if [ $HOOK_VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}✅ No obvious hook violations found${NC}"
else
    echo -e "${YELLOW}⚠️  Found $HOOK_VIOLATIONS potential hook violations - manual review recommended${NC}"
fi
echo ""

# 4. Check build output
echo "📦 Validating build output..."
if [ -d "dist/public" ]; then
    BUILD_SIZE=$(du -sh dist/public 2>/dev/null | cut -f1 || echo "unknown")
    echo "  Build size: $BUILD_SIZE"

    if [ -f "dist/public/index.html" ]; then
        echo -e "${GREEN}✅ Build output valid${NC}"
    else
        echo -e "${RED}❌ Missing index.html in build output${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Build output directory not found${NC}"
    exit 1
fi
echo ""

# 5. Check for common issues
echo "🔧 Checking for common issues..."

# Check for console.log in production code (optional warning)
CONSOLE_LOGS=$(grep -r "console.log" client/src --include="*.tsx" --include="*.ts" | wc -l || echo 0)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "  ${YELLOW}⚠️  Found $CONSOLE_LOGS console.log statements${NC}"
fi

# Check for TODO comments
TODO_COUNT=$(grep -r "TODO\|FIXME" client/src --include="*.tsx" --include="*.ts" | wc -l || echo 0)
if [ "$TODO_COUNT" -gt 0 ]; then
    echo -e "  ${YELLOW}ℹ️  Found $TODO_COUNT TODO/FIXME comments${NC}"
fi

echo ""
echo -e "${GREEN}✅ All validation checks passed!${NC}"
echo "🚀 Safe to push and deploy"
