#!/bin/bash

echo "=== 1. CHECKING HUNTER.IO INTEGRATION STATUS ==="
echo "Checking matchingService.js for Hunter.io integration:"
grep -n -A5 -B5 "hunter\|Hunter\|HUNTER" backend/src/services/matchingService.js 2>/dev/null || echo "No Hunter.io references found"

echo -e "\nChecking for Hunter API key in .env files:"
grep "HUNTER" backend/.env backend/.env.example 2>/dev/null || echo "No HUNTER key found in .env files"

echo -e "\nChecking for external expert search implementation:"
grep -n "external\|External" backend/src/services/matchingService.js | head -10

echo -e "\n=== 2. DATABASE SCHEMA CHECK ==="
echo "Checking for ExpertSearchCriteria in Prisma schema:"
grep -n -A10 "ExpertSearchCriteria" backend/prisma/schema.prisma 2>/dev/null || echo "ExpertSearchCriteria model not found"

echo -e "\nChecking InstitutionalIdea model:"
grep -n -A15 "model InstitutionalIdea" backend/prisma/schema.prisma 2>/dev/null

echo -e "\n=== 3. API ROUTES CHECK ==="
echo "Looking for idea routes:"
find backend/src -name "*idea*.js" -o -name "*idea*.ts" | grep -E "(route|controller)" | head -10

echo -e "\nChecking idea creation endpoint:"
grep -r "router.post.*idea" backend/src/routes/ 2>/dev/null | head -5

echo -e "\n=== 4. FRONTEND FORM LOCATION ==="
echo "Looking for idea creation forms:"
find frontend/src -name "*[Ii]dea*" -name "*.jsx" | grep -i "creat\|form" | head -10

echo -e "\nChecking for existing IdeaCreationForm:"
ls -la frontend/src/components/IdeaCreationForm.jsx 2>/dev/null || echo "IdeaCreationForm.jsx not found"

echo -e "\n=== 5. API SERVICE STRUCTURE ==="
echo "Checking ideas API service:"
grep -n -A10 "ideas.*{" frontend/src/services/api.js 2>/dev/null || echo "Ideas service not found"

echo -e "\nChecking for create method:"
grep -n -A5 "create.*:" frontend/src/services/api.js 2>/dev/null

echo -e "\n=== 6. CHECKING CURRENT IDEA CREATION FLOW ==="
echo "Looking for current idea creation components:"
grep -r "createIdea\|CreateIdea\|idea.*create" frontend/src --include="*.jsx" --include="*.js" | grep -v node_modules | head -10

echo -e "\n=== PROJECT STRUCTURE OVERVIEW ==="
echo "Backend structure:"
tree backend/src -L 2 -d 2>/dev/null || ls -la backend/src/

echo -e "\nFrontend structure:"
tree frontend/src -L 2 -d 2>/dev/null || ls -la frontend/src/
