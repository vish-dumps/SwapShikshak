import { 
  users, 
  teachers, 
  transferRequests, 
  matches,
  type User, 
  type Teacher, 
  type TransferRequest,
  type Match,
  type InsertUser,
  type InsertTeacher,
  type InsertTeacherWithUserId,
  type InsertTransferRequest,
  type TeacherWithUser,
  type TransferRequestWithTeachers,
  type MatchWithTeachers
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
  
  // Teacher operations
  createTeacher(teacher: InsertTeacherWithUserId): Promise<Teacher>;
  getTeacherByUserId(userId: number): Promise<Teacher | undefined>;
  getTeacherById(id: number): Promise<Teacher | undefined>;
  updateTeacher(id: number, updates: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  getAllTeachers(): Promise<Teacher[]>;
  getTeachersWithUsers(): Promise<TeacherWithUser[]>;
  
  // Transfer request operations
  createTransferRequest(request: InsertTransferRequest): Promise<TransferRequest>;
  getTransferRequestById(id: number): Promise<TransferRequest | undefined>;
  getTransferRequestsForTeacher(teacherId: number): Promise<TransferRequestWithTeachers[]>;
  getTransferRequestsByTeacher(teacherId: number): Promise<TransferRequestWithTeachers[]>;
  updateTransferRequestStatus(id: number, status: string): Promise<TransferRequest | undefined>;
  
  // Match operations
  createMatch(teacher1Id: number, teacher2Id: number, matchType: string, distance?: number, score?: number): Promise<Match>;
  getMatchesForTeacher(teacherId: number): Promise<MatchWithTeachers[]>;
  deleteMatch(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teachers: Map<number, Teacher>;
  private transferRequests: Map<number, TransferRequest>;
  private matches: Map<number, Match>;
  private currentUserId: number;
  private currentTeacherId: number;
  private currentRequestId: number;
  private currentMatchId: number;

  constructor() {
    this.users = new Map();
    this.teachers = new Map();
    this.transferRequests = new Map();
    this.matches = new Map();
    this.currentUserId = 1;
    this.currentTeacherId = 1;
    this.currentRequestId = 1;
    this.currentMatchId = 1;
  }

  

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id: this.currentUserId++,
      email: insertUser.email,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async createTeacher(insertTeacher: InsertTeacherWithUserId): Promise<Teacher> {
    const teacher: Teacher = {
      id: this.currentTeacherId++,
      userId: insertTeacher.userId,
      name: insertTeacher.name,
      subjects: insertTeacher.subjects as string[],
      gradeLevel: insertTeacher.gradeLevel,
      phoneNumber: insertTeacher.phoneNumber,
      currentSchool: insertTeacher.currentSchool,
      currentSchoolAddress: insertTeacher.currentSchoolAddress || null,
      currentDistrict: insertTeacher.currentDistrict,
      currentLatitude: insertTeacher.currentLatitude || null,
      currentLongitude: insertTeacher.currentLongitude || null,
      currentSchoolLatitude: insertTeacher.currentSchoolLatitude || null,
      currentSchoolLongitude: insertTeacher.currentSchoolLongitude || null,
      homeDistrict: insertTeacher.homeDistrict,
      homeLatitude: insertTeacher.homeLatitude || null,
      homeLongitude: insertTeacher.homeLongitude || null,
      preferredDistricts: insertTeacher.preferredDistricts as string[],
      preferredLocationLatitude: insertTeacher.preferredLocationLatitude || null,
      preferredLocationLongitude: insertTeacher.preferredLocationLongitude || null,
      maxDistance: insertTeacher.maxDistance || 100,
      hideContact: insertTeacher.hideContact ?? true,
      allowRequests: insertTeacher.allowRequests ?? true,
      emailNotifications: insertTeacher.emailNotifications ?? true,
      experience: insertTeacher.experience || 0,
      isActive: insertTeacher.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.teachers.set(teacher.id, teacher);
    return teacher;
  }

  async getTeacherByUserId(userId: number): Promise<Teacher | undefined> {
    return Array.from(this.teachers.values()).find(teacher => teacher.userId === userId);
  }

  async getTeacherById(id: number): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async updateTeacher(id: number, updates: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const teacher = this.teachers.get(id);
    if (!teacher) return undefined;

    const updatedTeacher: Teacher = {
      ...teacher,
      ...updates,
      updatedAt: new Date(),
    };
    this.teachers.set(id, updatedTeacher);
    return updatedTeacher;
  }

  async getAllTeachers(): Promise<Teacher[]> {
    return Array.from(this.teachers.values());
  }

  async getTeachersWithUsers(): Promise<TeacherWithUser[]> {
    const teachers = Array.from(this.teachers.values());
    return teachers.map(teacher => {
      const user = this.users.get(teacher.userId);
      return {
        ...teacher,
        user: user!,
      };
    });
  }

  async createTransferRequest(insertRequest: InsertTransferRequest): Promise<TransferRequest> {
    const request: TransferRequest = {
      id: this.currentRequestId++,
      fromTeacherId: insertRequest.fromTeacherId,
      toTeacherId: insertRequest.toTeacherId,
      status: insertRequest.status || "pending",
      message: insertRequest.message || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transferRequests.set(request.id, request);
    return request;
  }

  async getTransferRequestById(id: number): Promise<TransferRequest | undefined> {
    return this.transferRequests.get(id);
  }

  async getTransferRequestsForTeacher(teacherId: number): Promise<TransferRequestWithTeachers[]> {
    const requests = Array.from(this.transferRequests.values())
      .filter(request => request.toTeacherId === teacherId);
    
    return requests.map(request => {
      const fromTeacher = this.teachers.get(request.fromTeacherId)!;
      const toTeacher = this.teachers.get(request.toTeacherId)!;
      const fromUser = this.users.get(fromTeacher.userId)!;
      const toUser = this.users.get(toTeacher.userId)!;
      
      return {
        ...request,
        fromTeacher: { ...fromTeacher, user: fromUser },
        toTeacher: { ...toTeacher, user: toUser },
      };
    });
  }

  async getTransferRequestsByTeacher(teacherId: number): Promise<TransferRequestWithTeachers[]> {
    const requests = Array.from(this.transferRequests.values())
      .filter(request => request.fromTeacherId === teacherId);
    
    return requests.map(request => {
      const fromTeacher = this.teachers.get(request.fromTeacherId)!;
      const toTeacher = this.teachers.get(request.toTeacherId)!;
      const fromUser = this.users.get(fromTeacher.userId)!;
      const toUser = this.users.get(toTeacher.userId)!;
      
      return {
        ...request,
        fromTeacher: { ...fromTeacher, user: fromUser },
        toTeacher: { ...toTeacher, user: toUser },
      };
    });
  }

  async updateTransferRequestStatus(id: number, status: string): Promise<TransferRequest | undefined> {
    const request = this.transferRequests.get(id);
    if (!request) return undefined;

    const updatedRequest: TransferRequest = {
      ...request,
      status,
      updatedAt: new Date(),
    };
    this.transferRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async createMatch(teacher1Id: number, teacher2Id: number, matchType: string, distance?: number, score?: number): Promise<Match> {
    const match: Match = {
      id: this.currentMatchId++,
      teacher1Id,
      teacher2Id,
      matchType,
      distance: distance?.toString() || null,
      score: score || 0,
      createdAt: new Date(),
    };
    this.matches.set(match.id, match);
    return match;
  }

  async getMatchesForTeacher(teacherId: number): Promise<MatchWithTeachers[]> {
    const matches = Array.from(this.matches.values())
      .filter(match => match.teacher1Id === teacherId || match.teacher2Id === teacherId);
    
    return matches.map(match => {
      const teacher1 = this.teachers.get(match.teacher1Id)!;
      const teacher2 = this.teachers.get(match.teacher2Id)!;
      const user1 = this.users.get(teacher1.userId)!;
      const user2 = this.users.get(teacher2.userId)!;
      
      return {
        ...match,
        teacher1: { ...teacher1, user: user1 },
        teacher2: { ...teacher2, user: user2 },
      };
    });
  }

  async deleteMatch(id: number): Promise<void> {
    this.matches.delete(id);
  }
}

export const storage = new MemStorage();
