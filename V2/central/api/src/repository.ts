import { type Document, ObjectId, type WithId } from 'mongodb';

export type PublicDocument<T extends Document> = Omit<T, '_id'> & { id: string };

export abstract class BaseRepository<T extends Document> {
  protected serialize(document: WithId<T>): PublicDocument<T> {
    const { _id, ...data } = document;

    return {
      ...(data as Omit<T, '_id'>),
      id: this.serializeId(_id),
    };
  }

  private serializeId(id: ObjectId): string {
    return id.toHexString();
  }
}
