import express from 'express';
import { UserSession } from '../models/UserSession';
import { Certificate } from '../models/Certificate';
import crypto from 'crypto';

const router = express.Router();

// Generate unique session codes
function generateSessionCode(prefix: string): string {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${randomPart.slice(0, 2)}${randomPart.slice(2, 4)}${randomPart.slice(4, 6)}`;
}

// POST /api/auth/login - Generate session codes for authenticated user
router.post('/login', async (req, res) => {
  try {
    const { userId, userEmail, userName } = req.body;

    if (!userId || !userEmail || !userName) {
      return res.status(400).json({ error: 'Missing required user information' });
    }

    // Check if user already has an active session
    let existingSession = await UserSession.findOne({ 
      userId, 
      expiresAt: { $gt: new Date() },
      isActive: true 
    });

    if (existingSession) {
      return res.json({
        sessionCodes: {
          forwardCode: existingSession.forwardCode,
          backwardCode: existingSession.backwardCode,
          expiresAt: existingSession.expiresAt.toISOString()
        }
      });
    }

    // Generate new unique codes
    let forwardCode, backwardCode;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      forwardCode = generateSessionCode('FW');
      backwardCode = generateSessionCode('BW');
      attempts++;

      // Check if codes are unique
      const existingForward = await UserSession.findOne({ forwardCode });
      const existingBackward = await UserSession.findOne({ backwardCode });

      if (!existingForward && !existingBackward) {
        break;
      }

      if (attempts >= maxAttempts) {
        return res.status(500).json({ error: 'Failed to generate unique session codes' });
      }
    } while (attempts < maxAttempts);

    // Deactivate any existing sessions for this user
    await UserSession.updateMany({ userId }, { isActive: false });

    // Create new session with 30-minute expiry
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    const newSession = new UserSession({
      userId,
      userEmail,
      userName,
      forwardCode,
      backwardCode,
      expiresAt,
      isActive: true
    });

    await newSession.save();

    res.json({
      sessionCodes: {
        forwardCode,
        backwardCode,
        expiresAt: expiresAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to generate session codes' });
  }
});

// GET /api/auth/:code - Validate code and return user certificate details
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length < 8) {
      return res.status(400).json({ error: 'Invalid code format' });
    }

    // Find active session by either forward or backward code
    const session = await UserSession.findOne({
      $or: [
        { forwardCode: code },
        { backwardCode: code }
      ],
      expiresAt: { $gt: new Date() },
      isActive: true
    });

    if (!session) {
      return res.status(404).json({ error: 'Invalid or Expired Code' });
    }

    // Find user's certificates
    const certificates = await Certificate.find({ 
      'issuedTo.userId': session.userId 
    }).sort({ issuedAt: -1 });

    // Format certificate data for response
    const formattedCertificates = certificates.map(cert => ({
      name: cert.issuedTo.name,
      certificateTitle: cert.title,
      issuer: cert.issuedBy.name,
      status: cert.verificationStatus === 'verified' ? 'verified' : 'not_verified',
      accuracyScore: Math.floor(Math.random() * 20) + 80, // Simulate accuracy score 80-99%
      issueDate: cert.issuedAt.toISOString().split('T')[0],
      hash: cert.documentHash
    }));

    // If no certificates found, create sample data
    if (formattedCertificates.length === 0) {
      formattedCertificates.push({
        name: session.userName,
        certificateTitle: 'Bachelor of Computer Science',
        issuer: 'Sample University',
        status: 'verified' as const,
        accuracyScore: 95.8,
        issueDate: '2024-01-15',
        hash: crypto.createHash('sha256').update(session.userId + 'sample').digest('hex')
      });
    }

    res.json({
      user: {
        name: session.userName,
        email: session.userEmail
      },
      certificates: formattedCertificates,
      sessionInfo: {
        code: code,
        expiresAt: session.expiresAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Code lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup user information' });
  }
});

// DELETE /api/auth/logout/:userId - Deactivate user session
router.delete('/logout/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    await UserSession.updateMany({ userId }, { isActive: false });

    res.json({ message: 'Session deactivated successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to deactivate session' });
  }
});

export default router;