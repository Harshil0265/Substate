#!/bin/bash

# SUBSTATE Deployment Script
# This script helps you deploy to GitHub and Vercel

echo "🚀 SUBSTATE Deployment Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}📦 Initializing Git repository...${NC}"
    git init
    echo -e "${GREEN}✅ Git initialized${NC}"
else
    echo -e "${GREEN}✅ Git repository already initialized${NC}"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo -e "${YELLOW}Please create .env file from .env.example${NC}"
    exit 1
fi

# Test build
echo ""
echo -e "${YELLOW}🔨 Testing build...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Please fix errors before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Add all files
echo ""
echo -e "${YELLOW}📝 Adding files to git...${NC}"
git add .

# Get commit message
echo ""
echo -e "${YELLOW}💬 Enter commit message (or press Enter for default):${NC}"
read commit_message

if [ -z "$commit_message" ]; then
    commit_message="Deploy: Update SUBSTATE platform"
fi

# Commit changes
git commit -m "$commit_message"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
fi

# Check if remote exists
if ! git remote | grep -q origin; then
    echo ""
    echo -e "${YELLOW}🔗 No remote repository found${NC}"
    echo -e "${YELLOW}Enter your GitHub repository URL:${NC}"
    echo -e "${YELLOW}Example: https://github.com/username/substate.git${NC}"
    read repo_url
    
    if [ -z "$repo_url" ]; then
        echo -e "${RED}❌ No repository URL provided${NC}"
        exit 1
    fi
    
    git remote add origin "$repo_url"
    echo -e "${GREEN}✅ Remote repository added${NC}"
fi

# Push to GitHub
echo ""
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Go to https://vercel.com"
    echo "2. Import your GitHub repository"
    echo "3. Add environment variables from .env"
    echo "4. Deploy!"
    echo ""
    echo -e "${YELLOW}📚 For detailed instructions, see DEPLOYMENT.md${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo -e "${YELLOW}Please check your repository URL and credentials${NC}"
    exit 1
fi
