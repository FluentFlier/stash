#!/bin/bash
# Script to fix __pycache__ conflicts in git merge

echo "=== Fixing __pycache__ merge conflicts ==="
echo ""

# Step 1: Remove __pycache__ directories from Git tracking (if they're tracked)
echo "Step 1: Removing __pycache__ from Git tracking..."
git rm -r --cached processes/__pycache__/ 2>/dev/null || echo "  (__pycache__ not tracked or already removed)"

# Step 2: Ensure .gitignore has __pycache__/ pattern
echo ""
echo "Step 2: Verifying .gitignore contains __pycache__/..."
if ! grep -q "__pycache__/" .gitignore; then
    echo "  Adding __pycache__/ to .gitignore..."
    echo "" >> .gitignore
    echo "# Python cache" >> .gitignore
    echo "__pycache__/" >> .gitignore
else
    echo "  ✓ __pycache__/ already in .gitignore"
fi

# Step 3: Stage the changes
echo ""
echo "Step 3: Staging changes..."
git add .gitignore

echo ""
echo "=== Done! ==="
echo ""
echo "Next steps:"
echo "  1. If merging, resolve any remaining conflicts and commit"
echo "  2. Commit the removal: git commit -m 'Remove __pycache__ from tracking'"
echo "  3. The .pyc files will now be ignored in future commits"
