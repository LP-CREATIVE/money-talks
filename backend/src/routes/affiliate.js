// backend/src/routes/affiliate.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Get or create affiliate profile
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get or create affiliate profile
    let affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId },
      include: {
        referrals: {
          include: {
            referredUser: {
              select: {
                email: true,
                organizationName: true,
                createdAt: true,
                userType: true
              }
            }
          }
        },
        earnings: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    // Create profile if doesn't exist
    if (!affiliateProfile) {
      const referralCode = generateReferralCode();
      affiliateProfile = await prisma.affiliateProfile.create({
        data: {
          userId,
          referralCode
        },
        include: {
          referrals: true,
          earnings: true
        }
      });
    }

    // Get statistics
    const stats = await prisma.$transaction([
      // Total referrals
      prisma.affiliateReferral.count({
        where: { affiliateId: affiliateProfile.id }
      }),
      // Active referrals (users who made purchases)
      prisma.affiliateReferral.count({
        where: {
          affiliateId: affiliateProfile.id,
          referredUser: {
            OR: [
              { answers: { some: {} } },
              { resalePurchases: { some: {} } }
            ]
          }
        }
      }),
      // This month's earnings
      prisma.affiliateEarning.aggregate({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: {
            gte: new Date(new Date().setDate(1)) // First day of current month
          }
        },
        _sum: {
          amount: true
        }
      })
    ]);

    res.json({
      profile: affiliateProfile,
      stats: {
        totalReferrals: stats[0],
        activeReferrals: stats[1],
        monthlyEarnings: stats[2]._sum.amount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate dashboard' });
  }
});

// Get referral link
router.get('/referral-link', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId }
    });

    if (!affiliateProfile) {
      return res.status(404).json({ error: 'Affiliate profile not found' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/register?ref=${affiliateProfile.referralCode}`;

    res.json({ referralLink, referralCode: affiliateProfile.referralCode });
  } catch (error) {
    console.error('Error generating referral link:', error);
    res.status(500).json({ error: 'Failed to generate referral link' });
  }
});

// Get earnings history
router.get('/earnings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId }
    });

    if (!affiliateProfile) {
      return res.status(404).json({ error: 'Affiliate profile not found' });
    }

    const earnings = await prisma.affiliateEarning.findMany({
      where: { affiliateId: affiliateProfile.id },
      include: {
        affiliate: {
          include: {
            referrals: {
              include: {
                referredUser: {
                  select: {
                    organizationName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.affiliateEarning.count({
      where: { affiliateId: affiliateProfile.id }
    });

    res.json({
      earnings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// Request payout
router.post('/payout', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, payoutMethod } = req.body;

    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId }
    });

    if (!affiliateProfile) {
      return res.status(404).json({ error: 'Affiliate profile not found' });
    }

    if (amount > affiliateProfile.pendingEarnings) {
      return res.status(400).json({ error: 'Insufficient pending earnings' });
    }

    // Minimum payout threshold
    const minimumPayout = 100;
    if (amount < minimumPayout) {
      return res.status(400).json({ 
        error: `Minimum payout amount is $${minimumPayout}` 
      });
    }

    // Create payout request (in production, integrate with payment provider)
    const payoutRequest = await prisma.$transaction(async (tx) => {
      // Update affiliate profile
      await tx.affiliateProfile.update({
        where: { id: affiliateProfile.id },
        data: {
          pendingEarnings: { decrement: amount },
          paidEarnings: { increment: amount }
        }
      });

      // Mark earnings as paid
      await tx.affiliateEarning.updateMany({
        where: {
          affiliateId: affiliateProfile.id,
          status: 'PENDING'
        },
        data: {
          status: 'COMPLETED',
          paidAt: new Date()
        }
      });

      return {
        id: crypto.randomUUID(),
        amount,
        status: 'PROCESSING',
        method: payoutMethod,
        createdAt: new Date()
      };
    });

    res.json({
      message: 'Payout request created successfully',
      payout: payoutRequest
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({ error: 'Failed to process payout request' });
  }
});

// Helper function to generate referral code
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = router;
