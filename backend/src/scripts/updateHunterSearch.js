#!/usr/bin/env node

const fs = require('fs');

let content = fs.readFileSync('src/services/matchingService.js', 'utf8');

// Replace the limit and remove department/seniority filters
content = content.replace(/limit: 10/g, 'limit: 100');
content = content.replace(/limit: 5/g, 'limit: 100');

// Update the slice to get top 10 after scoring
content = content.replace(/\.slice\(0, 10\);/g, '.slice(0, 10);');

fs.writeFileSync('src/services/matchingService.js', content);
console.log('Updated Hunter.io search to get all emails and filter to top 10');
