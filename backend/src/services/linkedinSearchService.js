const puppeteer = require('puppeteer');

class LinkedInSearchService {
  async searchExperts(searchQuery, options = {}) {
    const { limit = 10 } = options;
    
    console.log('Starting LinkedIn search for:', searchQuery);
    
    const browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`;
      console.log('Navigating to:', searchUrl);
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      await page.waitForTimeout(3000);
      
      const isLoggedIn = await page.$('.feed-identity-module');
      
      if (!isLoggedIn) {
        console.log('LinkedIn requires login. Returning mock data for demo.');
        await browser.close();
        return this.getMockLinkedInProfiles(searchQuery);
      }
      
      const profiles = await page.evaluate(() => {
        const results = [];
        const profileCards = document.querySelectorAll('.search-results-container .entity-result');
        
        profileCards.forEach((card, index) => {
          if (index >= 10) return;
          
          const nameElement = card.querySelector('.entity-result__title-text a span span');
          const titleElement = card.querySelector('.entity-result__primary-subtitle');
          const locationElement = card.querySelector('.entity-result__secondary-subtitle');
          const linkElement = card.querySelector('.entity-result__title-text a');
          
          if (nameElement && titleElement) {
            results.push({
              name: nameElement.innerText.trim(),
              title: titleElement.innerText.trim(),
              location: locationElement?.innerText.trim() || 'Not specified',
              profileUrl: linkElement?.href || '#',
              connectionDegree: card.querySelector('.entity-result__badge-text')?.innerText || 'N/A'
            });
          }
        });
        
        return results;
      });
      
      await browser.close();
      return profiles;
      
    } catch (error) {
      console.error('LinkedIn search error:', error);
      await browser.close();
      return this.getMockLinkedInProfiles(searchQuery);
    }
  }
  
  getMockLinkedInProfiles(searchQuery) {
    console.log('Returning mock LinkedIn profiles for:', searchQuery);
    
    const mockProfiles = [
      {
        name: 'Sarah Chen',
        title: 'Senior Battery Engineer at Tesla',
        location: 'Fremont, California',
        profileUrl: 'https://linkedin.com/in/mock-sarah-chen',
        connectionDegree: '2nd',
        expertise: ['battery technology', 'EVs', 'supply chain']
      },
      {
        name: 'Michael Rodriguez',
        title: 'Supply Chain Director - EV Division at Ford',
        location: 'Detroit, Michigan',
        profileUrl: 'https://linkedin.com/in/mock-michael-rodriguez',
        connectionDegree: '3rd',
        expertise: ['automotive', 'supply chain', 'China operations']
      },
      {
        name: 'Dr. Jennifer Wu',
        title: 'Battery Cost Analyst at Bloomberg NEF',
        location: 'San Francisco, California',
        profileUrl: 'https://linkedin.com/in/mock-jennifer-wu',
        connectionDegree: '2nd',
        expertise: ['battery costs', 'market analysis', 'EV economics']
      },
      {
        name: 'David Park',
        title: 'Former Tesla Gigafactory Operations Manager',
        location: 'Austin, Texas',
        profileUrl: 'https://linkedin.com/in/mock-david-park',
        connectionDegree: '3rd',
        expertise: ['Tesla operations', 'manufacturing', 'cost optimization']
      },
      {
        name: 'Lisa Thompson',
        title: 'VP Supply Chain at Rivian',
        location: 'Irvine, California',
        profileUrl: 'https://linkedin.com/in/mock-lisa-thompson',
        connectionDegree: '2nd',
        expertise: ['EV supply chain', 'supplier relations', 'cost management']
      }
    ];
    
    return mockProfiles.filter(profile => 
      searchQuery.toLowerCase().includes('tesla') || 
      searchQuery.toLowerCase().includes('battery') ||
      searchQuery.toLowerCase().includes('ev')
    );
  }
  
  async generateOutreachMessage(profile, question, offerAmount) {
    return {
      subject: `Paid Research Opportunity - ${offerAmount} for Your Expertise`,
      message: `Hi ${profile.name.split(' ')[0]},

I found your profile while searching for experts in ${question.industries?.join(' and ')} and was impressed by your experience as ${profile.title}.

We have a paid research opportunity that perfectly matches your expertise:

"${question.text}"

We're offering $${offerAmount} for a detailed answer to this question, which typically takes 30-60 minutes to complete.

Your background in ${profile.expertise?.join(', ') || 'this field'} makes you an ideal candidate to provide valuable insights on this topic.

Interested? Reply to this message or visit our platform to learn more.

Best regards,
Money Talks Research Platform`
    };
  }
}

module.exports = new LinkedInSearchService();
