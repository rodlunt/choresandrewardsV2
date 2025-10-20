#!/bin/bash

# Rollback to the last known working commit before today's changes
# This was commit f68a540 - before all the React hook "fixes"

echo "⚠️  WARNING: This will rollback to before all today's changes"
echo "This will revert to commit: f68a540 (Bump service worker cache to v4)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo "Rolling back..."
git reset --hard f68a540
git push origin main --force

echo "✅ Rolled back to last working version"
echo "The server will rebuild automatically in 1-2 minutes"
echo ""
echo "After rollback:"
echo "  1. Wait for deployment to complete"
echo "  2. Hard refresh browser (Ctrl+Shift+R)"
echo "  3. App should work (but child card click will still show minified error #310)"
