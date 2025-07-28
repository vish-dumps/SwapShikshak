import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTeacherSchema, insertTransferRequestSchema, loginSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { findMatches } from "./utils/matching";
import { getDistrictCoordinates } from "./utils/distance";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

// Authentication middleware
const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        user: { id: user.id, email: user.email },
        token
      });
    } catch (error) {
      res.status(400).json({ message: 'Invalid registration data' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await storage.verifyPassword(loginData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        user: { id: user.id, email: user.email },
        token
      });
    } catch (error) {
      res.status(400).json({ message: 'Invalid login data' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const teacher = await storage.getTeacherByUserId(user.id);

      res.json({
        user: { id: user.id, email: user.email },
        teacher
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Teacher routes
  app.post('/api/teachers', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const teacherData = insertTeacherSchema.parse(req.body);

      // Check if teacher profile already exists
      const existingTeacher = await storage.getTeacherByUserId(req.user!.id);
      if (existingTeacher) {
        return res.status(400).json({ message: 'Teacher profile already exists' });
      }

      // Add coordinates for districts if not provided
      if (!teacherData.currentLatitude || !teacherData.currentLongitude) {
        const coords = getDistrictCoordinates(teacherData.currentDistrict);
        if (coords) {
          teacherData.currentLatitude = coords.lat.toString();
          teacherData.currentLongitude = coords.lng.toString();
        }
      }

      if (!teacherData.homeLatitude || !teacherData.homeLongitude) {
        const coords = getDistrictCoordinates(teacherData.homeDistrict);
        if (coords) {
          teacherData.homeLatitude = coords.lat.toString();
          teacherData.homeLongitude = coords.lng.toString();
        }
      }

      const teacher = await storage.createTeacher({
        userId: req.user!.id,
        name: teacherData.name,
        subject: teacherData.subject,
        gradeLevel: teacherData.gradeLevel,
        phoneNumber: teacherData.phoneNumber,
        currentSchool: teacherData.currentSchool,
        currentDistrict: teacherData.currentDistrict,
        currentLatitude: teacherData.currentLatitude,
        currentLongitude: teacherData.currentLongitude,
        homeDistrict: teacherData.homeDistrict,
        homeLatitude: teacherData.homeLatitude,
        homeLongitude: teacherData.homeLongitude,
        preferredDistricts: teacherData.preferredDistricts,
        maxDistance: teacherData.maxDistance,
        hideContact: teacherData.hideContact,
        allowRequests: teacherData.allowRequests,
        emailNotifications: teacherData.emailNotifications,
        experience: teacherData.experience,
        isActive: teacherData.isActive
      });

      res.json(teacher);
    } catch (error) {
      res.status(400).json({ message: 'Invalid teacher data' });
    }
  });

  app.put('/api/teachers/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const teacher = await storage.getTeacherById(teacherId);

      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      if (teacher.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }

      const updateData = req.body;
      const updatedTeacher = await storage.updateTeacher(teacherId, updateData);

      res.json(updatedTeacher);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/teachers/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const teacher = await storage.getTeacherByUserId(req.user!.id);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/teachers/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const teacher = await storage.getTeacherByUserId(req.user!.id);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const updates = insertTeacherSchema.partial().parse(req.body);
      const updatedTeacher = await storage.updateTeacher(teacher.id, updates);

      res.json(updatedTeacher);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data' });
    }
  });

  // Match routes
  app.get('/api/matches', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const teacher = await storage.getTeacherByUserId(req.user!.id);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const allTeachers = await storage.getTeachersWithUsers();
      const currentTeacherWithUser = allTeachers.find(t => t.id === teacher.id);

      if (!currentTeacherWithUser) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const matches = findMatches(currentTeacherWithUser, allTeachers);

      // Apply filters from query params
      const { matchType, maxDistance, subject } = req.query;

      let filteredMatches = matches;

      if (matchType && matchType !== 'all') {
        filteredMatches = filteredMatches.filter(match => match.matchType === matchType);
      }

      if (maxDistance) {
        const maxDist = parseInt(maxDistance as string);
        filteredMatches = filteredMatches.filter(match => match.distance <= maxDist);
      }

      if (subject && subject !== 'all') {
        filteredMatches = filteredMatches.filter(match => 
          match.teacher.subject.toLowerCase().includes((subject as string).toLowerCase())
        );
      }

      res.json(filteredMatches);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Transfer request routes
  app.post('/api/transfer-requests', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const teacher = await storage.getTeacherByUserId(req.user!.id);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const requestData = insertTransferRequestSchema.parse(req.body);

      // Check if request already exists
      const existingRequests = await storage.getTransferRequestsByTeacher(teacher.id);
      const alreadyExists = existingRequests.some(r => 
        r.toTeacherId === requestData.toTeacherId && r.status === 'pending'
      );

      if (alreadyExists) {
        return res.status(400).json({ message: 'Request already sent to this teacher' });
      }

      const request = await storage.createTransferRequest({
        ...requestData,
        fromTeacherId: teacher.id
      });

      res.json(request);
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.get('/api/transfer-requests/received', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const teacher = await storage.getTeacherByUserId(req.user!.id);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const requests = await storage.getTransferRequestsForTeacher(teacher.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/transfer-requests/sent', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const teacher = await storage.getTeacherByUserId(req.user!.id);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const requests = await storage.getTransferRequestsByTeacher(teacher.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/transfer-requests/:id/status', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const request = await storage.getTransferRequestById(parseInt(id));
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }

      const teacher = await storage.getTeacherByUserId(req.user!.id);
      if (!teacher || request.toTeacherId !== teacher.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const updatedRequest = await storage.updateTransferRequestStatus(parseInt(id), status);
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Dashboard stats route
  app.get('/api/dashboard/stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const teacher = await storage.getTeacherByUserId(req.user!.id);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const allTeachers = await storage.getTeachersWithUsers();
      const currentTeacherWithUser = allTeachers.find(t => t.id === teacher.id);

      if (!currentTeacherWithUser) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const matches = findMatches(currentTeacherWithUser, allTeachers);
      const perfectMatches = matches.filter(m => m.matchType === 'perfect');
      const nearbyTeachers = matches.filter(m => m.matchType === 'nearby');

      const receivedRequests = await storage.getTransferRequestsForTeacher(teacher.id);
      const sentRequests = await storage.getTransferRequestsByTeacher(teacher.id);

      res.json({
        totalMatches: matches.length,
        perfectMatches: perfectMatches.length,
        nearbyTeachers: nearbyTeachers.length,
        receivedRequests: receivedRequests.length,
        sentRequests: sentRequests.length,
        pendingRequests: receivedRequests.filter(r => r.status === 'pending').length
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}