  calculateRelevance(person, entities) {
    let score = 0;
    
    if (!person.position) return 0;
    
    const positionLower = person.position.toLowerCase();
    
    if (entities.topics?.length > 0) {
      entities.topics.forEach(topic => {
        if (positionLower.includes(topic.toLowerCase())) {
          score += 30;
        }
      });
    }
    
    if (entities.functionalExpertise) {
      const expertise = entities.functionalExpertise.toLowerCase();
      if (positionLower.includes(expertise)) {
        score += 25;
      }
    }
    
    if (person.department) {
      const deptScore = {
        'executive': 20,
        'finance': entities.topics?.some(t => t.toLowerCase().includes('cost')) ? 15 : 5,
        'it': entities.topics?.some(t => t.toLowerCase().includes('digital') || t.toLowerCase().includes('technology')) ? 15 : 5,
        'operations': entities.functionalExpertise?.toLowerCase().includes('operations') ? 20 : 5
      };
      score += deptScore[person.department] || 0;
    }
    
    const seniorityBonus = {
      'executive': 15,
      'senior': 10,
      'junior': 2
    };
    score += seniorityBonus[person.seniority] || 5;
    
    score += Math.round((person.confidence || 0) / 10);
    
    return score;
  }
