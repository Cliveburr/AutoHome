import { ObjectId, type Collection, type WithId } from 'mongodb';
import { type AuditService } from './audit.js';
import { type AuthenticatedSession } from './authentication.js';
import { type Database } from './database.js';

interface AreaDocument {
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

interface RoomDocument {
  name: string;
  areaId?: ObjectId;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ModuleOrganizationDocument {
  roomId?: ObjectId | string;
}

export interface PublicArea {
  id: string;
  name: string;
  position: number;
}

export interface PublicRoom {
  id: string;
  name: string;
  areaId?: string;
  position: number;
}

export type OrganizationFailure =
  'area_not_found' | 'room_not_found' | 'area_in_use' | 'room_in_use';

export interface OrganizationResult<T> {
  value?: T;
  failure?: OrganizationFailure;
}

function isObjectId(value: string): boolean {
  return ObjectId.isValid(value) && new ObjectId(value).toHexString() === value;
}

function clampPosition(position: number | undefined, count: number): number {
  return position === undefined ? count : Math.min(position, count);
}

export class OrganizationService {
  private readonly areas: Collection<AreaDocument>;
  private readonly rooms: Collection<RoomDocument>;
  private readonly modules: Collection<ModuleOrganizationDocument>;

  constructor(
    database: Database,
    private readonly audit: AuditService,
  ) {
    this.areas = database.db.collection<AreaDocument>('areas');
    this.rooms = database.db.collection<RoomDocument>('rooms');
    this.modules = database.db.collection<ModuleOrganizationDocument>('modules');
  }

  async listAreas(): Promise<PublicArea[]> {
    return (await this.areas.find().sort({ position: 1, name: 1 }).toArray()).map((area) =>
      this.toPublicArea(area),
    );
  }

  async createArea(
    name: string,
    position: number | undefined,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<PublicArea> {
    const targetPosition = clampPosition(position, await this.areas.countDocuments());
    await this.areas.updateMany({ position: { $gte: targetPosition } }, { $inc: { position: 1 } });
    const now = new Date();
    const result = await this.areas.insertOne({
      name,
      position: targetPosition,
      createdAt: now,
      updatedAt: now,
    });
    const area: WithId<AreaDocument> = {
      _id: result.insertedId,
      name,
      position: targetPosition,
      createdAt: now,
      updatedAt: now,
    };
    await this.record('area.created', 'area', area._id, actor, originIp, {
      name,
      position: targetPosition,
    });
    return this.toPublicArea(area);
  }

  async updateArea(
    areaId: string,
    update: { name?: string; position?: number },
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<OrganizationResult<PublicArea>> {
    const area = await this.findArea(areaId);
    if (!area) return { failure: 'area_not_found' };

    const position =
      update.position === undefined
        ? area.position
        : clampPosition(update.position, Math.max(0, (await this.areas.countDocuments()) - 1));
    if (position !== area.position) {
      await this.moveArea(area, position);
    }
    const name = update.name ?? area.name;
    const updatedAt = new Date();
    await this.areas.updateOne({ _id: area._id }, { $set: { name, position, updatedAt } });
    const updated = { ...area, name, position, updatedAt };
    const action =
      update.name !== undefined && update.position !== undefined
        ? 'area.updated'
        : update.name !== undefined
          ? 'area.renamed'
          : 'area.reordered';
    await this.record(action, 'area', area._id, actor, originIp, { name, position });
    return { value: this.toPublicArea(updated) };
  }

  async deleteArea(
    areaId: string,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<OrganizationResult<void>> {
    const area = await this.findArea(areaId);
    if (!area) return { failure: 'area_not_found' };
    if (await this.rooms.countDocuments({ areaId: area._id }, { limit: 1 }))
      return { failure: 'area_in_use' };

    await this.areas.deleteOne({ _id: area._id });
    await this.areas.updateMany({ position: { $gt: area.position } }, { $inc: { position: -1 } });
    await this.record('area.deleted', 'area', area._id, actor, originIp, { name: area.name });
    return { value: undefined };
  }

  async listRooms(): Promise<PublicRoom[]> {
    return (await this.rooms.find().sort({ areaId: 1, position: 1, name: 1 }).toArray()).map(
      (room) => this.toPublicRoom(room),
    );
  }

  async createRoom(
    name: string,
    areaId: string | undefined,
    position: number | undefined,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<OrganizationResult<PublicRoom>> {
    const area = await this.resolveArea(areaId);
    if (areaId !== undefined && !area) return { failure: 'area_not_found' };
    const filter = this.roomAreaFilter(area?._id);
    const targetPosition = clampPosition(position, await this.rooms.countDocuments(filter));
    await this.rooms.updateMany(
      { ...filter, position: { $gte: targetPosition } },
      { $inc: { position: 1 } },
    );
    const now = new Date();
    const result = await this.rooms.insertOne({
      name,
      ...(area ? { areaId: area._id } : {}),
      position: targetPosition,
      createdAt: now,
      updatedAt: now,
    });
    const room: WithId<RoomDocument> = {
      _id: result.insertedId,
      name,
      ...(area ? { areaId: area._id } : {}),
      position: targetPosition,
      createdAt: now,
      updatedAt: now,
    };
    await this.record('room.created', 'room', room._id, actor, originIp, {
      name,
      ...(area ? { areaId: area._id.toHexString() } : {}),
      position: targetPosition,
    });
    return { value: this.toPublicRoom(room) };
  }

  async updateRoom(
    roomId: string,
    update: { name?: string; areaId?: string | null; position?: number },
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<OrganizationResult<PublicRoom>> {
    const room = await this.findRoom(roomId);
    if (!room) return { failure: 'room_not_found' };
    const requestedAreaId = update.areaId ?? undefined;
    const changesArea =
      update.areaId !== undefined && requestedAreaId !== room.areaId?.toHexString();
    const targetArea = changesArea ? await this.resolveArea(requestedAreaId) : undefined;
    if (changesArea && requestedAreaId !== undefined && !targetArea)
      return { failure: 'area_not_found' };

    const areaId = changesArea ? targetArea?._id : room.areaId;
    const targetFilter = this.roomAreaFilter(areaId);
    const targetCount = await this.rooms.countDocuments(targetFilter);
    const maximumPosition = changesArea ? targetCount : Math.max(0, targetCount - 1);
    const position =
      update.position === undefined && !changesArea
        ? room.position
        : clampPosition(update.position, maximumPosition);

    if (changesArea) {
      await this.rooms.updateMany(
        { ...this.roomAreaFilter(room.areaId), position: { $gt: room.position } },
        { $inc: { position: -1 } },
      );
      await this.rooms.updateMany(
        { ...targetFilter, position: { $gte: position } },
        { $inc: { position: 1 } },
      );
    } else if (position !== room.position) {
      await this.moveRoom(room, position);
    }

    const name = update.name ?? room.name;
    const updatedAt = new Date();
    await this.rooms.updateOne(
      { _id: room._id },
      {
        $set: { name, ...(areaId ? { areaId } : {}), position, updatedAt },
        ...(areaId ? {} : { $unset: { areaId: '' } }),
      },
    );
    const updated = { ...room, name, ...(areaId ? { areaId } : {}), position, updatedAt };
    if (!areaId) delete updated.areaId;
    await this.record('room.updated', 'room', room._id, actor, originIp, {
      name,
      ...(areaId ? { areaId: areaId.toHexString() } : {}),
      position,
    });
    return { value: this.toPublicRoom(updated) };
  }

  async deleteRoom(
    roomId: string,
    actor: AuthenticatedSession,
    originIp?: string,
  ): Promise<OrganizationResult<void>> {
    const room = await this.findRoom(roomId);
    if (!room) return { failure: 'room_not_found' };
    if (
      await this.modules.countDocuments(
        { roomId: { $in: [room._id, room._id.toHexString()] } },
        { limit: 1 },
      )
    ) {
      return { failure: 'room_in_use' };
    }

    await this.rooms.deleteOne({ _id: room._id });
    await this.rooms.updateMany(
      { ...this.roomAreaFilter(room.areaId), position: { $gt: room.position } },
      { $inc: { position: -1 } },
    );
    await this.record('room.deleted', 'room', room._id, actor, originIp, { name: room.name });
    return { value: undefined };
  }

  private async findArea(areaId: string): Promise<WithId<AreaDocument> | undefined> {
    if (!isObjectId(areaId)) return undefined;
    return (await this.areas.findOne({ _id: new ObjectId(areaId) })) ?? undefined;
  }

  private async findRoom(roomId: string): Promise<WithId<RoomDocument> | undefined> {
    if (!isObjectId(roomId)) return undefined;
    return (await this.rooms.findOne({ _id: new ObjectId(roomId) })) ?? undefined;
  }

  private async resolveArea(areaId: string | undefined): Promise<WithId<AreaDocument> | undefined> {
    return areaId === undefined ? undefined : this.findArea(areaId);
  }

  private async moveArea(area: WithId<AreaDocument>, position: number): Promise<void> {
    const delta = position < area.position ? 1 : -1;
    const range =
      position < area.position
        ? { $gte: position, $lt: area.position }
        : { $gt: area.position, $lte: position };
    await this.areas.updateMany({ position: range }, { $inc: { position: delta } });
  }

  private async moveRoom(room: WithId<RoomDocument>, position: number): Promise<void> {
    const delta = position < room.position ? 1 : -1;
    const range =
      position < room.position
        ? { $gte: position, $lt: room.position }
        : { $gt: room.position, $lte: position };
    await this.rooms.updateMany(
      { ...this.roomAreaFilter(room.areaId), position: range },
      { $inc: { position: delta } },
    );
  }

  private roomAreaFilter(areaId: ObjectId | undefined): {
    areaId?: ObjectId;
    $or?: Array<Record<string, unknown>>;
  } {
    return areaId ? { areaId } : { $or: [{ areaId: { $exists: false } }, { areaId: null }] };
  }

  private toPublicArea(area: WithId<AreaDocument>): PublicArea {
    return { id: area._id.toHexString(), name: area.name, position: area.position };
  }

  private toPublicRoom(room: WithId<RoomDocument>): PublicRoom {
    return {
      id: room._id.toHexString(),
      name: room.name,
      ...(room.areaId ? { areaId: room.areaId.toHexString() } : {}),
      position: room.position,
    };
  }

  private async record(
    action: string,
    targetType: 'area' | 'room',
    targetId: ObjectId,
    actor: AuthenticatedSession,
    originIp: string | undefined,
    details: Record<string, unknown>,
  ): Promise<void> {
    await this.audit.record({
      actorUserId: actor.userId,
      action,
      result: 'success',
      targetType,
      targetId: targetId.toHexString(),
      originIp,
      sessionId: actor.sessionId,
      details,
    });
  }
}
