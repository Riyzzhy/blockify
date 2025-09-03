import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// In-memory storage for demo (replace with MongoDB in production)
const userSessions = new Map();
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

// Generate unique session codes
function generateSessionCode(prefix) {
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
    const existingSession = Array.from(userSessions.values()).find(
      session => session.userId === userId && session.expiresAt > Date.now()
    );

    if (existingSession) {
      return res.json({
        sessionCodes: {
          forwardCode: existingSession.forwardCode,
          backwardCode: existingSession.backwardCode,
          expiresAt: new Date(existingSession.expiresAt).toISOString()
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
      const codeExists = Array.from(userSessions.values()).some(
        session => session.forwardCode === forwardCode || session.backwardCode === backwardCode
      );

      if (!codeExists) {
        break;
      }

      if (attempts >= maxAttempts) {
        return res.status(500).json({ error: 'Failed to generate unique session codes' });
      }
    } while (attempts < maxAttempts);

    // Create new session
    const expiresAt = Date.now() + SESSION_DURATION;
    const sessionData = {
      userId,
      userEmail,
      userName,
      forwardCode,
      backwardCode,
      createdAt: Date.now(),
      expiresAt,
      isActive: true
    };

    // Store both codes pointing to the same session
    userSessions.set(forwardCode, sessionData);
    userSessions.set(backwardCode, sessionData);

    res.json({
      sessionCodes: {
        forwardCode,
        backwardCode,
        expiresAt: new Date(expiresAt).toISOString()
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

    // Find session by code
    const session = userSessions.get(code);

    if (!session || session.expiresAt <= Date.now() || !session.isActive) {
      return res.status(404).json({ error: 'Invalid or Expired Code' });
    }

    // Generate sample certificate data (replace with actual DB query)
    const sampleCertificates = [
      {
        name: session.userName,
        certificateTitle: 'Bachelor of Computer Science',
        issuer: 'Tech University',
        status: 'verified',
        accuracyScore: 95.8,
        issueDate: '2024-01-15',
        hash: crypto.createHash('sha256').update(session.userId + 'cert1').digest('hex')
      },
      {
        name: session.userName,
        certificateTitle: 'Advanced Web Development Certificate',
        issuer: 'Digital Skills Institute',
        status: 'verified',
        accuracyScore: 92.3,
        issueDate: '2024-03-20',
        hash: crypto.createHash('sha256').update(session.userId + 'cert2').digest('hex')
      }
    ];

    res.json({
      user: {
        name: session.userName,
        email: session.userEmail
      },
      certificates: sampleCertificates,
      sessionInfo: {
        code: code,
        expiresAt: new Date(session.expiresAt).toISOString()
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

    // Find and deactivate all sessions for this user
    for (const [code, session] of userSessions.entries()) {
      if (session.userId === userId) {
        session.isActive = false;
      }
    }

    res.json({ message: 'Session deactivated successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to deactivate session' });
  }
});

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [code, session] of userSessions.entries()) {
    if (session.expiresAt <= now) {
      userSessions.delete(code);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

export default router;