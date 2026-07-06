import { BackgroundM3UParsingWorker } from '@/m3u/engine/BackgroundM3UParsingWorker';
import { M3UEngine } from '@/m3u/engine/M3UEngine';
import {
  M3UCategory,
  M3UCategoryRequest,
  M3UEngineState,
  M3UPage,
  M3URegisterSourceInput,
  M3USourceDescriptor,
  M3USourceStatus,
  M3UStreamMetadata,
  M3UStreamsByCategoryRequest,
} from '@/m3u/types';

export interface M3URepository {
  registerSource(input: M3URegisterSourceInput): Promise<M3USourceDescriptor>;
  checkSource(playlistId: string, signal?: AbortSignal): Promise<M3USourceStatus>;
  listCategories(request: M3UCategoryRequest): Promise<M3UPage<M3UCategory>>;
  listStreamsByCategory(request: M3UStreamsByCategoryRequest): Promise<M3UPage<M3UStreamMetadata>>;
  startBackgroundParsing(playlistId: string): void;
  stopBackgroundParsing(): void;
  refreshCachedData(playlistId: string): Promise<void>;
  getEngineState(): M3UEngineState;
  cancelRequests(): void;
}

export class EngineBackedM3URepository implements M3URepository {
  constructor(
    private readonly engine: M3UEngine,
    private readonly backgroundWorker: BackgroundM3UParsingWorker,
  ) {}

  registerSource(input: M3URegisterSourceInput): Promise<M3USourceDescriptor> {
    return this.engine.registerSource(input);
  }

  checkSource(playlistId: string, signal?: AbortSignal): Promise<M3USourceStatus> {
    return this.engine.checkSource(playlistId, signal);
  }

  listCategories(request: M3UCategoryRequest): Promise<M3UPage<M3UCategory>> {
    return this.engine.loadCategories(request);
  }

  listStreamsByCategory(request: M3UStreamsByCategoryRequest): Promise<M3UPage<M3UStreamMetadata>> {
    return this.engine.loadStreamsByCategory(request);
  }

  startBackgroundParsing(playlistId: string): void {
    this.backgroundWorker.start(playlistId);
  }

  stopBackgroundParsing(): void {
    this.backgroundWorker.stop();
  }

  refreshCachedData(playlistId: string): Promise<void> {
    return this.backgroundWorker.runOnce(playlistId);
  }

  getEngineState(): M3UEngineState {
    return this.engine.getState();
  }

  cancelRequests(): void {
    this.engine.cancelAll();
  }
}
