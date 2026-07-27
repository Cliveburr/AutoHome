import { ObjectId, type Collection } from 'mongodb';
import { type Database } from './database.js';

export type AuditResult = 'success' | 'failure';

export interface AuditLogDocument {
  actorUserId?: ObjectId;
  action: string;
  result: AuditResult;
  targetType?: string;
  targetId?: string;
  originIp?: string;
  sessionId?: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditEntry {
  actorUserId?: string;
  action: string;
  result: AuditResult;
  targetType?: string;
  targetId?: string;
  originIp?: string;
  sessionId?: string;
  details?: Record<string, unknown>;
}

const sensitiveDetailKey = /password|hash|cookie|token|secret|authorization/i;
const operationalFirmwareIdentityKey = 'firmwareSha256';

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return sanitizeDetails(value as Record<string, unknown>);
  }

  return value;
}

export function sanitizeDetails(details: Record<string, unknown> = {}): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(details)
      .filter(([key]) => key === operationalFirmwareIdentityKey || !sensitiveDetailKey.test(key))
      .map(([key, value]) => [key, sanitizeValue(value)]),
  );
}

export class AuditService {
  private readonly auditLogs: Collection<AuditLogDocument>;

  constructor(database: Database) {
    this.auditLogs = database.db.collection<AuditLogDocument>('audit_logs');
  }

  async record(entry: AuditEntry): Promise<void> {
    const actorUserId =
      entry.actorUserId && ObjectId.isValid(entry.actorUserId)
        ? new ObjectId(entry.actorUserId)
        : undefined;

    await this.auditLogs.insertOne({
      ...(actorUserId ? { actorUserId } : {}),
      action: entry.action,
      result: entry.result,
      ...(entry.targetType ? { targetType: entry.targetType } : {}),
      ...(entry.targetId ? { targetId: entry.targetId } : {}),
      ...(entry.originIp ? { originIp: entry.originIp } : {}),
      ...(entry.sessionId ? { sessionId: entry.sessionId } : {}),
      details: sanitizeDetails(entry.details),
      createdAt: new Date(),
    });
  }
}
