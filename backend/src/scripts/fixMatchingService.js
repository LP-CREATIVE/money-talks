#!/usr/bin/env node

const fs = require('fs');

const content = fs.readFileSync('src/services/matchingService.js', 'utf8');

// Find the searchHunterRealtime method and update it
const updatedContent = content.replace(
  /const response = await axios\.get\('https:\/\/api\.hunter\.io\/v2\/domain-search', \{[\s\S]*?params: \{[\s\S]*?\}[\s\S]*?\}\);/g,
  `const response = await axios.get('https://api.hunter.io/v2/domain-search', {
              params: {
                domain: domain,
                api_key: apiKey,
                limit: 10
              }
            });`
);

// Save the updated file
fs.writeFileSync('src/services/matchingService.js', updatedContent);
console.log('Updated matching service to remove department filtering');
