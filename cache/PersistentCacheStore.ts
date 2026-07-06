import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheRecord, CacheScope } from '@/repositories/CacheRepository';
import { AppLogger } from '@/stability/AppLogger';
import { CacheStore } from './CacheStore';
import { cacheStorageKey, parseCacheStorageKey } from './cacheKeys';

export class PersistentCacheStore implements CacheStore {
  async get<T>(namespace: string, key: string, scope?: CacheScope): Promise<CacheRecord<T> | undefined> {
    const storageKey = cacheStorageKey(namespace, key, scope);
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (!raw) return undefined;
      const record = this.parseRecord<T>(raw, storageKey);
      if (!record) await AsyncStorage.removeItem(storageKey).catch(() => undefined);
      return record;
    } catch (error) {
      AppLogger.warn('persistent_cache_get_failed', { namespace, key, error: String(error) });
      await AsyncStorage.removeItem(storageKey).catch(() => undefined);
      return undefined;
    }
  }

  async set<T>(record: CacheRecord<T>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        cacheStorageKey(record.namespace, record.key, { playlistId: record.playlistId }),
        JSON.stringify(record),
      );
    } catch (error) {
      AppLogger.warn('persistent_cache_set_failed', { namespace: record.namespace, key: record.key, error: String(error) });
    }
  }

  async remove(namespace: string, key: string, scope?: CacheScope): Promise<void> {
    await AsyncStorage.removeItem(cacheStorageKey(namespace, key, scope)).catch((error) => {
      AppLogger.warn('persistent_cache_remove_failed', { namespace, key, error: String(error) });
    });
  }

  async clear(namespace?: string, scope?: CacheScope): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => {
        const parsed = parseCacheStorageKey(key);
        if (!parsed) return false;
        if (namespace && parsed.namespace !== namespace) return false;
        if (scope?.playlistId && parsed.playlistId !== scope.playlistId) return false;
        return true;
      });
      if (cacheKeys.length) await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      AppLogger.warn('persistent_cache_clear_failed', { namespace, error: String(error) });
    }
  }

  async list<T>(namespace: string, scope?: CacheScope): Promise<CacheRecord<T>[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => {
        const parsed = parseCacheStorageKey(key);
        return parsed?.namespace === namespace && (!scope?.playlistId || parsed.playlistId === scope.playlistId);
      });
      if (!cacheKeys.length) return [];
      const pairs = await AsyncStorage.multiGet(cacheKeys);
      const records: CacheRecord<T>[] = [];
      const corrupted: string[] = [];
      for (const [key, value] of pairs) {
        if (!value) continue;
        const record = this.parseRecord<T>(value, key);
        if (record) records.push(record);
        else corrupted.push(key);
      }
      if (corrupted.length) await AsyncStorage.multiRemove(corrupted).catch(() => undefined);
      return records;
    } catch (error) {
      AppLogger.warn('persistent_cache_list_failed', { namespace, error: String(error) });
      return [];
    }
  }

  private parseRecord<T>(raw: string, storageKey: string): CacheRecord<T> | undefined {
    try {
      const parsed = JSON.parse(raw) as Partial<CacheRecord<T>>;
      if (!parsed || typeof parsed !== 'object' || !parsed.key || !parsed.namespace || !('value' in parsed)) {
        AppLogger.warn('persistent_cache_invalid_record', { storageKey });
        return undefined;
      }
      return parsed as CacheRecord<T>;
    } catch (error) {
      AppLogger.warn('persistent_cache_corrupted_json', { storageKey, error: String(error) });
      return undefined;
    }
  }
}
