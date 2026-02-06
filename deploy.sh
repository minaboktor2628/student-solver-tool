#!/bin/bash

echo "Starting deployment..."

GREEN='\033[0;32m'
NC='\033[0m'

# do we need to clone repo?
echo "Checking out main branch..."
git checkout main

echo "Pulling latest changes from GitHub..."
git pull origin main

echo "Installing dependencies..."
pnpm install

echo "Running database migrations..."
pnpm db:migrate

echo "Building the project..."
pnpm build

echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "To start the server, run: pnpm start"