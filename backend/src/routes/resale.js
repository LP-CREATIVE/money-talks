// backend/src/routes/resale.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

// Initialize Stripe only if key exists
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

const prisma = new PrismaClient();

// List an answer for resale
router.post('/list', requireAuth, async (req, res) => {
  try {
    const { answerId, resalePrice } = req.body;
    const userId = req.user.id;

    // Verify the user owns this answer
    const answer = await prisma.userAnswer.findFirst({
      where: {
        id: answerId,
        userId: userId,
        isPaid: true, // Only paid answers can be resold
        isListedForResale: false
      },
      include: {
        question: {
          include: {
            idea: true
          }
        }
      }
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found or not eligible for resale' });
    }

    // Update answer to list for resale
    const updatedAnswer = await prisma.userAnswer.update({
      where: { id: answerId },
      data: {
        isListedForResale: true,
        resalePrice: resalePrice,
        listedForResaleAt: new Date()
      }
    });

    res.json({
      message: 'Answer listed for resale successfully',
      answer: updatedAnswer
    });
  } catch (error) {
    console.error('Error listing answer for resale:', error);
    res.status(500).json({ error: 'Failed to list answer for resale' });
  }
});

// Get all resale listings
router.get('/marketplace', requireAuth, async (req, res) => {
  try {
    const { sector, minPrice, maxPrice, search, sortBy = 'newest' } = req.query;

    const where = {
      isListedForResale: true,
      isHidden: false,
      userId: {
        not: req.user.id // Don't show user's own listings
      }
    };

    // Add filters
    if (sector) {
      where.question = {
        idea: {
          sector: sector
        }
      };
    }

    if (minPrice || maxPrice) {
      where.resalePrice = {};
      if (minPrice) where.resalePrice.gte = parseFloat(minPrice);
      if (maxPrice) where.resalePrice.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { 
          question: { 
            text: { contains: search, mode: 'insensitive' } 
          } 
        }
      ];
    }

    // Determine sort order
    let orderBy = {};
    switch (sortBy) {
      case 'price-low':
        orderBy = { resalePrice: 'asc' };
        break;
      case 'price-high':
        orderBy = { resalePrice: 'desc' };
        break;
      case 'popular':
        orderBy = { resaleCount: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { listedForResaleAt: 'desc' };
    }

    const listings = await prisma.userAnswer.findMany({
      where,
      orderBy,
      include: {
        user: {
          select: {
            organizationName: true,
            reputationScore: true
          }
        },
        question: {
          include: {
            idea: {
              select: {
                title: true,
                sector: true,
                marketCap: true
              }
            }
          }
        },
        _count: {
          select: {
            resalePurchases: true
          }
        }
      }
    });

    res.json({ listings });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace listings' });
  }
});

// Purchase a resale listing
router.post('/purchase', requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment processing not configured' });
    }

    const { answerId } = req.body;
    const buyerId = req.user.id;

    // Get the answer details
    const answer = await prisma.userAnswer.findFirst({
      where: {
        id: answerId,
        isListedForResale: true,
        userId: {
          not: buyerId // Can't buy your own answer
        }
      },
      include: {
        user: true,
        question: {
          include: {
            idea: true
          }
        }
      }
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not available for purchase' });
    }

    // Check if buyer already purchased this answer
    const existingPurchase = await prisma.resalePurchase.findFirst({
      where: {
        answerId: answerId,
        buyerId: buyerId,
        transactionStatus: 'COMPLETED'
      }
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'You have already purchased this answer' });
    }

    // Calculate payment splits
    const purchasePrice = answer.resalePrice;
    const platformFee = purchasePrice * 0.30; // 30% to platform
    const sellerEarnings = purchasePrice * 0.50; // 50% to original buyer
    const expertRoyalty = purchasePrice * 0.20; // 20% to expert

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(purchasePrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        answerId: answerId,
        buyerId: buyerId,
        sellerId: answer.userId,
        type: 'resale_purchase'
      }
    });

    // Create resale purchase record
    const resalePurchase = await prisma.resalePurchase.create({
      data: {
        answerId,
        buyerId,
        sellerId: answer.userId,
        purchasePrice,
        platformFee,
        sellerEarnings,
        expertRoyalty,
        stripePaymentIntentId: paymentIntent.id,
        transactionStatus: 'PENDING'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      resalePurchaseId: resalePurchase.id,
      amount: purchasePrice
    });
  } catch (error) {
    console.error('Error creating resale purchase:', error);
    res.status(500).json({ error: 'Failed to create resale purchase' });
  }
});

// Confirm resale purchase (after Stripe payment)
router.post('/purchase/confirm', requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment processing not configured' });
    }

    const { resalePurchaseId, paymentIntentId } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Get resale purchase details
    const resalePurchase = await prisma.resalePurchase.findUnique({
      where: { id: resalePurchaseId },
      include: {
        answer: {
          include: {
            user: true
          }
        }
      }
    });

    if (!resalePurchase) {
      return res.status(404).json({ error: 'Resale purchase not found' });
    }

    // Start transaction to update all records
    const result = await prisma.$transaction(async (tx) => {
      // Update resale purchase status
      await tx.resalePurchase.update({
        where: { id: resalePurchaseId },
        data: {
          transactionStatus: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Update answer stats
      await tx.userAnswer.update({
        where: { id: resalePurchase.answerId },
        data: {
          resaleCount: { increment: 1 },
          totalResaleRevenue: { increment: resalePurchase.purchasePrice }
        }
      });

      // Update seller balance
      await tx.user.update({
        where: { id: resalePurchase.sellerId },
        data: {
          walletBalance: { increment: resalePurchase.sellerEarnings }
        }
      });

      // Update expert balance (royalty)
      await tx.user.update({
        where: { id: resalePurchase.answer.userId },
        data: {
          walletBalance: { increment: resalePurchase.expertRoyalty }
        }
      });

      // Check for affiliate earnings
      const buyer = await tx.user.findUnique({
        where: { id: resalePurchase.buyerId },
        include: {
          referrer: {
            include: {
              affiliateProfile: true
            }
          }
        }
      });

      if (buyer.referrer && buyer.referrer.affiliateProfile) {
        const affiliateEarning = resalePurchase.expertRoyalty * 0.10; // 10% of expert earnings
        
        await tx.affiliateEarning.create({
          data: {
            affiliateId: buyer.referrer.affiliateProfile.id,
            sourceTransactionId: resalePurchase.id,
            sourceType: 'RESALE',
            amount: affiliateEarning,
            status: 'COMPLETED'
          }
        });

        await tx.affiliateProfile.update({
          where: { id: buyer.referrer.affiliateProfile.id },
          data: {
            totalEarnings: { increment: affiliateEarning },
            pendingEarnings: { increment: affiliateEarning }
          }
        });
      }

      return resalePurchase;
    });

    res.json({
      message: 'Resale purchase completed successfully',
      resalePurchase: result
    });
  } catch (error) {
    console.error('Error confirming resale purchase:', error);
    res.status(500).json({ error: 'Failed to confirm resale purchase' });
  }
});

// Get user's resale activity
router.get('/my-activity', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's listed answers
    const myListings = await prisma.userAnswer.findMany({
      where: {
        userId: userId,
        isListedForResale: true
      },
      include: {
        question: {
          include: {
            idea: {
              select: {
                title: true,
                sector: true
              }
            }
          }
        },
        _count: {
          select: {
            resalePurchases: true
          }
        }
      },
      orderBy: {
        listedForResaleAt: 'desc'
      }
    });

    // Get user's purchases
    const myPurchases = await prisma.resalePurchase.findMany({
      where: {
        buyerId: userId,
        transactionStatus: 'COMPLETED'
      },
      include: {
        answer: {
          include: {
            question: {
              include: {
                idea: {
                  select: {
                    title: true,
                    sector: true
                  }
                }
              }
            },
            user: {
              select: {
                organizationName: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    // Get earnings from resales
    const myResaleEarnings = await prisma.resalePurchase.aggregate({
      where: {
        sellerId: userId,
        transactionStatus: 'COMPLETED'
      },
      _sum: {
        sellerEarnings: true
      }
    });

    // Get royalty earnings (as expert)
    const myRoyaltyEarnings = await prisma.resalePurchase.aggregate({
      where: {
        answer: {
          userId: userId
        },
        transactionStatus: 'COMPLETED'
      },
      _sum: {
        expertRoyalty: true
      }
    });

    res.json({
      myListings,
      myPurchases,
      earnings: {
        resaleEarnings: myResaleEarnings._sum.sellerEarnings || 0,
        royaltyEarnings: myRoyaltyEarnings._sum.expertRoyalty || 0
      }
    });
  } catch (error) {
    console.error('Error fetching resale activity:', error);
    res.status(500).json({ error: 'Failed to fetch resale activity' });
  }
});

// Remove answer from resale
router.delete('/unlist/:answerId', requireAuth, async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user.id;

    const answer = await prisma.userAnswer.findFirst({
      where: {
        id: answerId,
        userId: userId,
        isListedForResale: true
      }
    });

    if (!answer) {
      return res.status(404).json({ error: 'Listed answer not found' });
    }

    const updatedAnswer = await prisma.userAnswer.update({
      where: { id: answerId },
      data: {
        isListedForResale: false,
        resalePrice: null,
        listedForResaleAt: null
      }
    });

    res.json({
      message: 'Answer removed from resale marketplace',
      answer: updatedAnswer
    });
  } catch (error) {
    console.error('Error unlisting answer:', error);
    res.status(500).json({ error: 'Failed to unlist answer' });
  }
});

module.exports = router;
