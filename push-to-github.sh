#!/bin/bash

# GitHub Push Helper Script
# Run this to push all changes to GitHub

echo "========================================"
echo "  StockFlow - GitHub Push Helper"
echo "========================================"
echo ""

# Check if on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    echo "⚠️  Warning: You're on branch '$BRANCH', not 'main'"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Show what will be pushed
echo "📦 Commits ready to push:"
git log origin/main..HEAD --oneline
echo ""

echo "📁 Files changed:"
git diff --stat origin/main..HEAD | tail -1
echo ""

# Ask for confirmation
read -p "Push these changes to GitHub? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Push cancelled"
    exit 1
fi

# Try to push
echo ""
echo "🚀 Pushing to GitHub..."
if git push origin main; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 View at: https://github.com/Siddharthpatni/Digital_Inventory"
else
    echo ""
    echo "❌ Push failed!"
    echo ""
    echo "This usually means authentication is required."
    echo ""
    echo "Options:"
    echo "1. Use GitHub Desktop (easiest)"
    echo "2. Set up Personal Access Token:"
    echo "   • Go to: https://github.com/settings/tokens"
    echo "   • Generate new token (classic)"
    echo "   • Select 'repo' scope"
    echo "   • Then run: git push https://YOUR_TOKEN@github.com/Siddharthpatni/Digital_Inventory.git main"
    echo ""
    echo "3. Set up SSH keys:"
    echo "   • Follow: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
    echo ""
    exit 1
fi
