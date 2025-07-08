            try {
              console.log(`\nSearching ${company} at domain: ${domain}...`);
              
              // First try without department filter
              let response = await axios.get('https://api.hunter.io/v2/domain-search', {
                params: {
                  domain: domain,
                  api_key: apiKey,
                  limit: 10
                }
              });

              // If no results, try with seniority filter
              if (!response.data.data.emails || response.data.data.emails.length === 0) {
                response = await axios.get('https://api.hunter.io/v2/domain-search', {
                  params: {
                    domain: domain,
                    api_key: apiKey,
                    seniority: 'senior,executive',
                    limit: 10
                  }
                });
              }

              if (response.data.data.emails && response.data.data.emails.length > 0) {
                const emails = response.data.data.emails;
                console.log(`Found ${emails.length} emails at ${domain}`);
                foundEmails = true;
