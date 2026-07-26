import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { ObjectId, type Collection, type WithId } from 'mongodb';
import { type Database } from './database.js';

const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

export interface UserDocument {
  username: string;
  passwordHash: string;
  role: 'administrador';
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
  role: 'administrador';
  active: boolean;
  passwordChangeRequired: boolean;
}

export interface AuthenticatedSession {
  sessionId: string;
  user: PublicUser;
}

export class AuthenticationService {
  private readonly users: Collection<UserDocument>;
  private readonly sessions: Collection<SessionDocument>;

  constructor(
    database: Database,
    private readonly bootstrapAdminPassword: string | undefined,
  ) {
    this.users = database.db.collection<UserDocument>('users');
    this.sessions = database.db.collection<SessionDocument>('sessions');
  }

  async initialize(): Promise<void> {
    if ((await this.users.countDocuments({}, { limit: 1 })) > 0) {
      return;
    }

    const now = new Date();
    await this.users.insertOne({
      username: 'admin',
      passwordHash: await this.hashPassword(this.bootstrapAdminPassword ?? 'admin'),
      role: 'administrador',
      active: true,
      passwordChangeRequired: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  async login(username: string, password: string): Promise<AuthenticatedSession | undefined> {
    const user = await this.users.findOne({ username, active: true });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
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

    return { sessionId, user: this.toPublicUser(user) };
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

    return { sessionId, user: this.toPublicUser(user) };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessions.deleteOne({ sessionId });
  }

  async changePassword(sessionId: string, currentPassword: string, newPassword: string): Promise<PublicUser | undefined> {
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