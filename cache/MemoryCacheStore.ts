import { CacheRecord, CacheScope } from '@/repositories/CacheRepository';
import { CacheStore } from './CacheStore';
import { cacheIdentity } from './cacheKeys';

export class MemoryCacheStore implements CacheStore {
  private readonly records = new Map<string, CacheRecord<unknown>>();

  async get<T>(namespace: string, key: string, scope?: CacheScope): Promise<CacheRecord<T> | undefined> {
    return this.records.get(cacheIdentity(namespace, key, scope)) as CacheRecord<T> | undefined;
  }

  async set<T>(record: CacheRecord<T>): Promise<void> {
    this.records.set(cacheIdentity(record.namespace, record.key, { playlistId: record.playlistId }), record as CacheRecord<unknown>);
  }

  async remove(namespace: string, key: string, scope?: CacheScope): Promise<void> {
    this.records.delete(cacheIdentity(namespace, key, scope));
  }

  async clear(namespace?: string, scope?: CacheScope): Promise<void> {
    for (const [identity, record] of [...this.records.entries()]) {
      if (namespace && record.namespace !== namespace) continue;
      if (scope?.playlistId && record.playlistId !== scope.playlistId) continue;
      this.records.delete(identity);
    }
  }

  async list<T>(namespace: string, scope?: CacheScope): Promise<CacheRecord<T>[]> {
    return [...this.records.values()].filter((record) =>
      record.namespace === namespace && (!scope?.playlistId || record.playlistId === scope.playlistId),
    ) as CacheRecord<T>[];
  }
}
