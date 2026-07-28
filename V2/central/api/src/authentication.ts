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

export type UserManagementFailure =
  'user_not_found' | 'username_taken' | 'last_active_administrator';

export interface UserManagementResult {
  user?: PublicUser;
  failure?: UserManagementFailure;
}

export class AuthenticationService {
  private readonly users: Collection<UserDocument>;
  private readonly sessions: Collection<SessionDocument>;

  constructor(
    database: Database,
    private readonly bootstrapAdminPassword: string | undefined,
    bootstrapAdminEasyPassOrAudit: boolean | AuditService = false,
    audit?: AuditService,
  ) {
    this.bootstrapAdminEasyPass =
      typeof bootstrapAdminEasyPassOrAudit === 'boolean' ? bootstrapAdminEasyPassOrAudit : false;
    this.audit =
      typeof bootstrapAdminEasyPassOrAudit === 'boolean' ? audit : bootstrapAdminEasyPassOrAudit;
    this.users = database.db.collection<UserDocument>('users');
    this.sessions = database.db.collection<SessionDocument>('sessions');
  }

  private readonly bootstrapAdminEasyPass: boolean;
  private readonly audit?: AuditService;

  async initialize(): Promise<void> {
    // Bootstrap users are created lazily on the first successful admin login.
  }

  async login(
    username: string,
    password: string,
    originIp?: string,
  ): Promise<AuthenticatedSession | undefined> {
    let user = await this.users.findOne({ username, active: true });
    if (!user && username === 'admin' && this.bootstrapAdminPassword === password) {
      const now = new Date();
      const result = await this.users.insertOne({
        username: 'admin',
        passwordHash: await this.hashPassword(password),
        role: 'administrador',
        active: true,
        passwordChangeRequired: true,
        createdAt: now,
        updatedAt: now,
      });
      user = await this.users.findOne({ _id: result.insertedId, active: true });
      await this.audit?.record({
        action: 'user.created',
        result: 'success',
        targetType: 'user',
        targetId: result.insertedId.toHexString(),
        details: { username: 'admin', role: 'administrador', bootstrap: true },
      });
    }
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

    if (!this.bootstrapAdminEasyPass && currentPassword === newPassword) {
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

  async listUsers(): Promise<PublicUser[]> {
    const users = await this.users.find().sort({ username: 1 }).toArray();
    return users.map((user) => this.toPublicUser(user));
  }

  async createUser(
    username: string,
    password: string,
    role: UserRole,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<UserManagementResult> {
    const now = new Date();

    try {
      const result = await this.users.insertOne({
        username,
        passwordHash: await this.hashPassword(password),
        role,
        active: true,
        passwordChangeRequired: false,
        createdAt: now,
        updatedAt: now,
      });
      const user = await this.users.findOne({ _id: result.insertedId });
      if (!user) {
        return { failure: 'user_not_found' };
      }

      await this.recordUserMutation('user.created', user, actor, originIp);
      return { user: this.toPublicUser(user) };
    } catch (error) {
      if (this.isDuplicateUsernameError(error)) {
        return { failure: 'username_taken' };
      }

      throw error;
    }
  }

  async changeUserRole(
    userId: string,
    role: UserRole,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<UserManagementResult> {
    const user = await this.findUser(userId);
    if (!user) {
      return { failure: 'user_not_found' };
    }

    if (
      user.active &&
      user.role === 'administrador' &&
      role !== 'administrador' &&
      !(await this.hasAnotherActiveAdministrator(user._id))
    ) {
      return { failure: 'last_active_administrator' };
    }

    await this.users.updateOne({ _id: user._id }, { $set: { role, updatedAt: new Date() } });
    const updatedUser = { ...user, role };
    await this.recordUserMutation('user.role_changed', updatedUser, actor, originIp);
    return { user: this.toPublicUser(updatedUser) };
  }

  async setUserActive(
    userId: string,
    active: boolean,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<UserManagementResult> {
    const user = await this.findUser(userId);
    if (!user) {
      return { failure: 'user_not_found' };
    }

    if (
      !active &&
      user.active &&
      user.role === 'administrador' &&
      !(await this.hasAnotherActiveAdministrator(user._id))
    ) {
      return { failure: 'last_active_administrator' };
    }

    await this.users.updateOne({ _id: user._id }, { $set: { active, updatedAt: new Date() } });
    if (!active) {
      await this.sessions.deleteMany({ userId: user._id });
    }

    const updatedUser = { ...user, active };
    await this.recordUserMutation(
      active ? 'user.activated' : 'user.deactivated',
      updatedUser,
      actor,
      originIp,
    );
    return { user: this.toPublicUser(updatedUser) };
  }

  async resetUserPassword(
    userId: string,
    password: string,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<UserManagementResult> {
    const user = await this.findUser(userId);
    if (!user) {
      return { failure: 'user_not_found' };
    }

    const passwordHash = await this.hashPassword(password);
    await this.users.updateOne(
      { _id: user._id },
      { $set: { passwordHash, passwordChangeRequired: true, updatedAt: new Date() } },
    );
    await this.sessions.deleteMany({ userId: user._id });

    const updatedUser = { ...user, passwordHash, passwordChangeRequired: true };
    await this.recordUserMutation('user.password_reset', updatedUser, actor, originIp);
    return { user: this.toPublicUser(updatedUser) };
  }

  private async findUser(userId: string): Promise<WithId<UserDocument> | undefined> {
    if (!ObjectId.isValid(userId)) {
      return undefined;
    }

    return (await this.users.findOne({ _id: new ObjectId(userId) })) ?? undefined;
  }

  private async hasAnotherActiveAdministrator(userId: ObjectId): Promise<boolean> {
    return (
      (await this.users.countDocuments({
        _id: { $ne: userId },
        role: 'administrador',
        active: true,
      })) > 0
    );
  }

  private async recordUserMutation(
    action: string,
    user: WithId<UserDocument>,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<void> {
    await this.audit?.record({
      actorUserId: actor.userId,
      action,
      result: 'success',
      targetType: 'user',
      targetId: user._id.toHexString(),
      originIp,
      sessionId: actor.sessionId,
      details: { username: user.username, role: user.role, active: user.active },
    });
  }

  private isDuplicateUsernameError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
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
