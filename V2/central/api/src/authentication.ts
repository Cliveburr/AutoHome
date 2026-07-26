import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { ObjectId, type Collection, type WithId } from 'mongodb';
import { type AuditService } from './audit.js';
import { type Database } from './database.js';

const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

export type UserRole = 'basico' | 'administrador';

export interface UserDocument {
  username: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  passwordChangeRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionDocument {
  sessionId: string;
  userId: ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
  active: boolean;
  passwordChangeRequired: boolean;
}

export interface AuthenticatedSession {
  sessionId: string;
  userId: string;
  user: PublicUser;
}

export class AuthenticationService {
  private readonly users: Collection<UserDocument>;
  private readonly sessions: Collection<SessionDocument>;

  constructor(
    database: Database,
    private readonly bootstrapAdminPassword: string | undefined,
    private readonly audit?: AuditService,
  ) {
    this.users = database.db.collection<UserDocument>('users');
    this.sessions = database.db.collection<SessionDocument>('sessions');
  }

  async initialize(): Promise<void> {
    if ((await this.users.countDocuments({}, { limit: 1 })) > 0) {
      return;
    }

    const now = new Date();
    const result = await this.users.insertOne({
      username: 'admin',
      passwordHash: await this.hashPassword(this.bootstrapAdminPassword ?? 'admin'),
      role: 'administrador',
      active: true,
      passwordChangeRequired: true,
      createdAt: now,
      updatedAt: now,
    });

    await this.audit?.record({
      action: 'user.created',
      result: 'success',
      targetType: 'user',
      targetId: result.insertedId.toHexString(),
      details: { username: 'admin', role: 'administrador', bootstrap: true },
    });
  }

  async login(
    username: string,
    password: string,
    originIp?: string,
  ): Promise<AuthenticatedSession | undefined> {
    const user = await this.users.findOne({ username, active: true });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      await this.audit?.record({
        action: 'auth.login',
        result: 'failure',
        targetType: 'user',
        targetId: username,
        originIp,
      });
      return undefined;
    }

    const sessionId = randomUUID();
    const now = new Date();
    await this.sessions.insertOne({
      sessionId,
      userId: user._id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + sessionDurationMs),
    });

    await this.audit?.record({
      actorUserId: user._id.toHexString(),
      action: 'auth.login',
      result: 'success',
      targetType: 'user',
      targetId: user._id.toHexString(),
      originIp,
      sessionId,
    });

    return { sessionId, userId: user._id.toHexString(), user: this.toPublicUser(user) };
  }

  async getSession(sessionId: string): Promise<AuthenticatedSession | undefined> {
    const session = await this.sessions.findOne({ sessionId, expiresAt: { $gt: new Date() } });
    if (!session) {
      return undefined;
    }

    const user = await this.users.findOne({ _id: session.userId, active: true });
    if (!user) {
      await this.sessions.deleteOne({ sessionId });
      return undefined;
    }

    return { sessionId, userId: user._id.toHexString(), user: this.toPublicUser(user) };
  }

  async logout(sessionId: string, originIp?: string): Promise<void> {
    const session = await this.getSession(sessionId);
    await this.sessions.deleteOne({ sessionId });
    if (session) {
      await this.audit?.record({
        actorUserId: session.userId,
        action: 'auth.logout',
        result: 'success',
        targetType: 'user',
        targetId: session.userId,
        originIp,
        sessionId,
      });
    }
  }

  async changePassword(
    sessionId: string,
    currentPassword: string,
    newPassword: string,
    originIp?: string,
  ): Promise<PublicUser | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return undefined;
    }

    const user = await this.users.findOne({ _id: new ObjectId(session.user.id) });
    if (!user || !(await argon2.verify(user.passwordHash, currentPassword))) {
      return undefined;
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.users.updateOne(
      { _id: user._id },
      { $set: { passwordHash, passwordChangeRequired: false, updatedAt: new Date() } },
    );

    await this.audit?.record({
      actorUserId: session.userId,
      action: 'user.password_changed',
      result: 'success',
      targetType: 'user',
      targetId: session.userId,
      originIp,
      sessionId,
    });

    return this.toPublicUser({ ...user, passwordHash, passwordChangeRequired: false });
  }

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  private toPublicUser(user: WithId<UserDocument>): PublicUser {
    return {
      id: user._id.toHexString(),
      username: user.username,
      role: user.role,
      active: user.active,
      passwordChangeRequired: user.passwordChangeRequired,
    };
  }
}
