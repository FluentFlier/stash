# Fixing __pycache__ Merge Conflicts

## Why .gitignore Isn't Working

`.gitignore` only prevents **untracked** files from being added. If `.pyc` files were already committed to Git history in another branch, they will appear as conflicts during merge.

## Solution: Remove __pycache__ from Git Tracking

### Step 1: During Merge Conflict Resolution

When you see merge conflicts, resolve them as follows:

**For `.gitignore` conflict:**
- Keep the version that includes `__pycache__/` and other Python patterns
- Or manually merge both versions

**For `.pyc` file conflicts:**
- Accept "delete" (remove them from tracking)
- Or manually delete them using: `git rm --cached <file>`

### Step 2: Complete the Merge

```powershell
# After resolving conflicts, stage everything
git add .gitignore

# Remove __pycache__ from tracking (if still present)
git rm -r --cached processes/__pycache__/ 2>$null

# Commit the merge
git commit -m "Merge: Remove __pycache__ from tracking"
```

### Step 3: Verify .gitignore is Correct

Make sure your `.gitignore` contains:

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
```

### Step 4: Clean Up Existing __pycache__ (Optional)

If you want to remove all `__pycache__` directories from Git history in all branches:

```powershell
# Find all __pycache__ files in Git
git ls-files | Select-String "__pycache__"

# Remove them from Git (but keep local files)
git rm -r --cached processes/__pycache__/
git commit -m "Remove __pycache__ from tracking"
```

## Quick Fix Command

Run this PowerShell command to fix conflicts:

```powershell
# Remove __pycache__ from tracking
git rm -r --cached processes/__pycache__/

# Ensure .gitignore is staged
git add .gitignore

# Complete merge (if in progress)
git commit -m "Resolve merge conflicts: remove __pycache__ from tracking"
```

## After This

Future `.pyc` files will be ignored because:
1. `.gitignore` now contains `__pycache__/`
2. Existing `.pyc` files are removed from tracking
3. New `.pyc` files will never be added to Git
