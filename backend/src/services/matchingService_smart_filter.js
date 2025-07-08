              console.log(`\nSearching ${company} at domain: ${domain}...`);
              
              // Get ALL emails from Hunter.io first
              const response = await axios.get('https://api.hunter.io/v2/domain-search', {
                params: {
                  domain: domain,
                  api_key: apiKey,
                  limit: 100  // Get as many as possible
                }
              });

              if (response.data.data.emails && response.data.data.emails.length > 0) {
                const emails = response.data.data.emails;
                console.log(`Found ${emails.length} total emails at ${domain}`);
                foundEmails = true;
                
                // Map and score ALL emails
                const allExperts = emails.map(person => {
                  let firstName = person.first_name || 'Unknown';
                  let lastName = person.last_name || 'Unknown';
                  
                  if ((!person.first_name || !person.last_name) && person.value) {
                    const emailParts = person.value.split('@')[0].split('.');
                    if (emailParts.length >= 2) {
                      firstName = person.first_name || emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
                      lastName = person.last_name || emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1);
                    }
                  }
                  
                  // Calculate relevance score for each person
                  let relevanceScore = 0;
                  
                  // Position/title relevance (40 points max)
                  if (person.position) {
                    const posLower = person.position.toLowerCase();
                    
                    // Topic matching
                    if (entities.topics?.length > 0) {
                      entities.topics.forEach(topic => {
                        if (posLower.includes(topic.toLowerCase())) {
                          relevanceScore += 20;
                        }
                      });
                    }
                    
                    // Functional expertise matching
                    if (entities.functionalExpertise && posLower.includes(entities.functionalExpertise.toLowerCase())) {
                      relevanceScore += 20;
                    }
                    
                    // Key position keywords
                    const keyPositions = ['director', 'vp', 'vice president', 'head', 'chief', 'manager', 'lead'];
                    keyPositions.forEach(key => {
                      if (posLower.includes(key)) {
                        relevanceScore += 10;
                      }
                    });
                  }
                  
                  // Seniority bonus (30 points max)
                  const seniorityScores = {
                    'executive': 30,
                    'senior': 20,
                    'junior': 5
                  };
                  relevanceScore += seniorityScores[person.seniority] || 10;
                  
                  // Department relevance (20 points max)
                  if (person.department) {
                    const targetDept = this.mapEntitiesToDepartment(entities);
                    if (targetDept && person.department === targetDept) {
                      relevanceScore += 20;
                    } else if (person.department === 'executive') {
                      relevanceScore += 15; // Executives are always somewhat relevant
                    }
                  }
                  
                  // Email confidence bonus (10 points max)
                  relevanceScore += Math.round((person.confidence || 0) / 10);
                  
                  return {
                    firstName: firstName,
                    lastName: lastName,
                    email: person.value,
                    emailConfidence: person.confidence || 85,
                    emailSource: 'hunter.io_api',
                    title: person.position || 'Not specified',
                    company: company,
                    department: person.department,
                    seniority: person.seniority,
                    linkedinUrl: person.linkedin || null,
                    skills: [],
                    status: 'PENDING_OUTREACH',
                    relevanceScore: relevanceScore,
                    hunterData: {
                      twitter: person.twitter,
                      phone: person.phone_number,
                      sources: person.sources?.length || 0
                    }
                  };
                });
                
                // Sort by relevance score and take top 10
                const topExperts = allExperts
                  .sort((a, b) => b.relevanceScore - a.relevanceScore)
                  .slice(0, 10);
                
                console.log(`Selected top ${topExperts.length} most relevant experts`);
                console.log('Relevance scores:', topExperts.map(e => e.relevanceScore));
                
                experts.push(...topExperts);
