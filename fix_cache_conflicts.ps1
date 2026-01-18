# PowerShell script to fix __pycache__ conflicts in git merge

Write-Host "=== Fixing __pycache__ merge conflicts ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Remove __pycache__ directories from Git tracking (if they're tracked)
Write-Host "Step 1: Removing __pycache__ from Git tracking..." -ForegroundColor Yellow
try {
    git rm -r --cached processes/__pycache__/ 2>$null
    Write-Host "  ✓ Removed __pycache__ from tracking" -ForegroundColor Green
} catch {
    Write-Host "  (__pycache__ not tracked or already removed)" -ForegroundColor Gray
}

# Step 2: Ensure .gitignore has __pycache__/ pattern
Write-Host ""
Write-Host "Step 2: Verifying .gitignore contains __pycache__/..." -ForegroundColor Yellow
$gitignoreContent = Get-Content .gitignore -Raw
if ($gitignoreContent -notmatch "__pycache__/") {
    Write-Host "  Adding __pycache__/ to .gitignore..." -ForegroundColor Yellow
    Add-Content .gitignore "`n# Python cache`n__pycache__/"
    Write-Host "  ✓ Added __pycache__/ to .gitignore" -ForegroundColor Green
} else {
    Write-Host "  ✓ __pycache__/ already in .gitignore" -ForegroundColor Green
}

# Step 3: Stage the changes
Write-Host ""
Write-Host "Step 3: Staging changes..." -ForegroundColor Yellow
git add .gitignore

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. If merging, resolve any remaining conflicts and commit"
Write-Host "  2. Commit the removal: git commit -m 'Remove __pycache__ from tracking'"
Write-Host "  3. The .pyc files will now be ignored in future commits"
