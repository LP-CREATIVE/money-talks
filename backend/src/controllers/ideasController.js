const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

// Get all ideas (Top 100 + paginated)
const getIdeas = async (req, res) => {
  try {
    console.log("Getting ideas with params:", req.query);
    
    const ideas = await prisma.institutionalIdea.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            organizationName: true
          }
        },
        contributions: {
          select: {
            amount: true,
            isRefundable: true,
            wasRefunded: true
          }
        },
        questions: {
          select: {
            id: true,
            text: true,
            createdAt: true
          }
        }
      }
    });

    console.log(`Found ${ideas.length} ideas`);
    console.log("First idea with questions:", ideas[0]?.questions);
    res.json({
      ideas,
      pagination: {
        page: 1,
        limit: 20,
        total: ideas.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error("Get ideas error:", error);
    res.status(500).json({ error: error.message });
  }
};// Create new idea (Institutional users only)
const createIdea = async (req, res) => {
 try {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
     return res.status(400).json({ errors: errors.array() });
   }

   const { title, summary, detailedPlan, sector, marketCap, expertSearchCriteria } = req.body;
   const userId = req.userId;

   // Check if user is institutional
   if (req.userType !== 'INSTITUTIONAL') {
     return res.status(403).json({ error: 'Only institutional users can submit ideas' });
   }

   // Create the idea with expert search criteria
   const idea = await prisma.institutionalIdea.create({
     data: {
       title,
       summary,
       detailedPlan,
       sector,
       marketCap,
       createdById: userId,
       status: 'QUEUED',
       // Store expert search criteria as JSON string
       expertSearchCriteria: expertSearchCriteria ? JSON.stringify(expertSearchCriteria) : null
     },
     include: {
       createdBy: {
         select: {
           id: true,
           email: true,
           organizationName: true
         }
       }
     }
   });

   res.status(201).json({
     message: 'Idea created successfully',
     idea
   });
 } catch (error) {
   console.error('Create idea error:', error);
   res.status(500).json({ error: 'Internal server error' });
 }
};

// Get single idea with details
const getIdeaById = async (req, res) => {
  try {
    const { id } = req.params;

    const idea = await prisma.institutionalIdea.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            organizationName: true
          }
        },
        contributions: {
          select: {
            amount: true,
            wasRefunded: true
          }
        },
        questions: {
          include: {
            submittedBy: {
              select: {
                id: true,
                organizationName: true
              }
            },
            _count: {
              select: {
                answers: true
              }
            }
          }
        }
      }
    });

    if (!idea) {
      return res.status(404).json({ error: "Idea not found" });
    }

    res.json(idea);
  } catch (error) {
    console.error("Get idea by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Update rankings (will be called by cron job)
const updateRankings = async (req, res) => {
 try {
   // Get all ideas ordered by total escrow
   const ideas = await prisma.institutionalIdea.findMany({
     orderBy: { totalEscrow: 'desc' }
   });

   // Update rankings and status
   const updates = ideas.map(async (idea, index) => {
     const rank = index + 1;
     const status = rank <= 100 ? 'TOP_100' : 'QUEUED';
     
     return prisma.institutionalIdea.update({
       where: { id: idea.id },
       data: { 
         escrowRank: rank,
         status 
       }
     });
   });

   await Promise.all(updates);

   res.json({ message: 'Rankings updated successfully' });
 } catch (error) {
   console.error('Update rankings error:', error);
   res.status(500).json({ error: 'Internal server error' });
 }
};

module.exports = {
 getIdeas,
 createIdea,
 getIdeaById,
 updateRankings
};
