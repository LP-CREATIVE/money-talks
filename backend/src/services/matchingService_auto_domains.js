  async searchHunterRealtime(entities, question) {
    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      console.log('Hunter.io API key not configured');
      return [];
    }

    console.log('\nStarting Hunter.io API search...');
    console.log('Entities:', JSON.stringify(entities, null, 2));
    
    const experts = [];
    const searchedDomains = new Set();
    
    if (entities.companies?.length > 0) {
      for (const company of entities.companies) {
        const domains = this.getAllPossibleDomains(company);
        let foundEmails = false;
        
        for (const domain of domains) {
          if (searchedDomains.has(domain) || foundEmails) continue;
          searchedDomains.add(domain);
          
          try {
            console.log(`\nSearching ${company} at domain: ${domain}...`);
            
            const response = await axios.get('https://api.hunter.io/v2/domain-search', {
              params: {
                domain: domain,
                api_key: apiKey,
                department: this.mapEntitiesToDepartment(entities),
                seniority: 'senior,executive',
                limit: 10
              }
            });

            if (response.data.data.emails && response.data.data.emails.length > 0) {
              const emails = response.data.data.emails;
              console.log(`Found ${emails.length} emails at ${domain}`);
              foundEmails = true;
              
              const companyExperts = emails
                .map(person => {
                  let firstName = person.first_name || 'Unknown';
                  let lastName = person.last_name || 'Unknown';
                  
                  if ((!person.first_name || !person.last_name) && person.value) {
                    const emailParts = person.value.split('@')[0].split('.');
                    if (emailParts.length >= 2) {
                      firstName = person.first_name || emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
                      lastName = person.last_name || emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1);
                    }
                  }
                  
                  const relevanceScore = this.calculateRelevance(person, entities);
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
                })
                .filter(person => person.relevanceScore > 0 || emails.length <= 5)
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, 10);
              
              experts.push(...companyExperts);
            } else {
              console.log(`No emails found at ${domain}`);
            }
          } catch (error) {
            if (error.response?.status === 429) {
              console.error('Hunter.io rate limit reached');
              break;
            }
            console.error(`Error searching ${domain}:`, error.response?.data?.errors?.[0]?.details || error.message);
          }
        }
        
        if (!foundEmails) {
          console.log(`No emails found for ${company} across all domain variations`);
        }
      }
    }

    if (experts.length === 0 && entities.industries?.length > 0) {
      console.log('\nNo company-specific results, searching by industry...');
      
      const industryDomains = {
        'technology': ['apple.com', 'google.com', 'microsoft.com'],
        'finance': ['goldmansachs.com', 'jpmorgan.com', 'morganstanley.com'],
        'automotive': ['tesla.com', 'gm.com', 'ford.com'],
        'battery manufacturing': ['panasonic.com', 'lg.com', 'catl.com'],
        'healthcare': ['jnj.com', 'pfizer.com', 'unitedhealth.com'],
        'fast food': ['us.mcd.com', 'yum.com', 'burgerking.com'],
        'restaurant': ['darden.com', 'starbucks.com', 'chipotle.com']
      };

      for (const industry of entities.industries) {
        const domains = industryDomains[industry.toLowerCase()] || [];
        
        for (const domain of domains.slice(0, 3)) {
          if (searchedDomains.has(domain)) continue;
          searchedDomains.add(domain);
          
          try {
            console.log(`Searching ${domain} for ${industry} experts...`);
            
            const response = await axios.get('https://api.hunter.io/v2/domain-search', {
              params: {
                domain: domain,
                api_key: apiKey,
                department: this.mapEntitiesToDepartment(entities),
                seniority: 'senior,executive',
                limit: 5
              }
            });

            if (response.data.data.emails) {
              const industryExperts = response.data.data.emails
                .map(person => {
                  let firstName = person.first_name || 'Unknown';
                  let lastName = person.last_name || 'Unknown';
                  
                  if ((!person.first_name || !person.last_name) && person.value) {
                    const emailParts = person.value.split('@')[0].split('.');
                    if (emailParts.length >= 2) {
                      firstName = person.first_name || emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
                      lastName = person.last_name || emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1);
                    }
                  }
                  
                  return {
                    firstName: firstName,
                    lastName: lastName,
                    email: person.value,
                    emailConfidence: person.confidence || 85,
                    emailSource: 'hunter.io_api',
                    title: person.position || 'Not specified',
                    company: domain.replace(/\.(com|org|net)$/, '').toUpperCase(),
                    department: person.department,
                    seniority: person.seniority,
                    linkedinUrl: person.linkedin || null,
                    skills: [],
                    status: 'PENDING_OUTREACH',
                    relevanceScore: this.calculateRelevance(person, entities)
                  };
                })
                .filter(person => person.relevanceScore > 0);
              
              experts.push(...industryExperts);
            }
          } catch (error) {
            console.error(`Error searching ${domain}:`, error.message);
          }
        }
      }
    }

    console.log(`\nTotal experts found: ${experts.length}`);
    
    return experts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20)
      .map(expert => this.formatHunterExpert(expert, entities, question));
  }

  getAllPossibleDomains(company) {
    const cleaned = company.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    const knownMappings = {
      'mcdonalds': ['us.mcd.com', 'corporate.mcdonalds.com', 'mcdonalds.com'],
      'google': ['google.com', 'abc.xyz'],
      'meta': ['meta.com', 'facebook.com'],
      'alphabet': ['abc.xyz', 'google.com'],
      'jpmorgan': ['jpmorgan.com', 'jpmorganchase.com', 'chase.com'],
      'goldmansachs': ['goldmansachs.com', 'gs.com'],
      'berkshirehathaway': ['berkshirehathaway.com', 'brk.com'],
      'johnsonjohnson': ['jnj.com', 'johnsonandjohnson.com'],
      'proctergamble': ['pg.com', 'procterandgamble.com'],
      'generalmotors': ['gm.com', 'generalmotors.com'],
      'fordmotor': ['ford.com', 'fordmotorcompany.com'],
      'waltdisney': ['disney.com', 'thewaltdisneycompany.com'],
      'att': ['att.com', 'about.att.com'],
      'verizon': ['verizon.com', 'verizonwireless.com'],
      'walmart': ['walmart.com', 'corporate.walmart.com'],
      'exxonmobil': ['exxonmobil.com', 'exxon.com', 'mobil.com'],
      'chevron': ['chevron.com', 'chevrontexaco.com'],
      'cvs': ['cvs.com', 'cvshealth.com'],
      'unitedhealth': ['unitedhealthgroup.com', 'uhc.com'],
      'bankofamerica': ['bankofamerica.com', 'bofa.com'],
      'wellsfargo': ['wellsfargo.com', 'wf.com'],
      'citigroup': ['citi.com', 'citigroup.com'],
      'morganstanley': ['morganstanley.com', 'ms.com'],
      'americanexpress': ['americanexpress.com', 'amex.com']
    };
    
    if (knownMappings[cleaned]) {
      return knownMappings[cleaned];
    }
    
    const variations = [
      `${cleaned}.com`,
      `${cleaned}.net`,
      `${cleaned}.org`,
      `corporate.${cleaned}.com`,
      `www.${cleaned}.com`,
      `us.${cleaned}.com`,
      `${cleaned}corp.com`,
      `${cleaned}inc.com`,
      `${cleaned}group.com`
    ];
    
    const withSpaces = company.toLowerCase().replace(/\s+/g, '');
    if (withSpaces !== cleaned) {
      variations.push(`${withSpaces}.com`);
    }
    
    const withDashes = company.toLowerCase().replace(/\s+/g, '-');
    if (withDashes !== cleaned) {
      variations.push(`${withDashes}.com`);
    }
    
    return [...new Set(variations)].slice(0, 5);
  }
