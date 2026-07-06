import { PlayerRepository } from '@/player/repositories/PlayerRepository';
import { PlayerCapabilities, PlayerMediaSession, PlayerMode, PlayerSource, SubtitleStyle } from '@/player/types';
import { RepositoryContainer } from '@/repositories/RepositoryContainer';
import { findContentItem } from '@/utils/contentMapper';

const defaultSubtitleStyle: SubtitleStyle = {
  fontScale: 1,
  color: '#FFFFFF',
  backgroundColor: 'rgba(0,0,0,0.45)',
  edgeStyle: 'dropShadow',
};

const capabilitiesFor = (mode: PlayerMode): PlayerCapabilities => ({
  canSeek: mode !== 'live',
  supportsThumbnails: mode !== 'live',
  supportsSkipIntro: mode === 'series',
  supportsNextEpisode: mode === 'series',
  supportsPreviousEpisode: mode === 'series',
  supportsAudioTracks: true,
  supportsSubtitles: mode !== 'live',
  supportsPlaybackSpeed: mode !== 'live',
  supportsAspectRatio: true,
  supportsBrightnessGesture: true,
  supportsVolumeGesture: true,
  supportsPiP: true,
  supportsChromecast: true,
  supportsAirPlay: true,
  supportsMiniPlayer: true,
});

export class RepositoryBackedPlayerRepository implements PlayerRepository {
  constructor(private readonly repositories: RepositoryContainer) {}

  async getMediaSession(mediaId: string): Promise<PlayerMediaSession | undefined> {
    const content = await findContentItem(mediaId, this.repositories);
    if (!content) return undefined;

    const mode: PlayerMode = content.kind === 'live' ? 'live' : content.kind === 'series' ? 'series' : 'movie';
    const durationSeconds = mode === 'live' ? undefined : content.durationLabel?.includes('h') ? 7200 : 3600;
    const progress = await this.repositories.userLibraryRepository.getContinueWatching(mediaId);
    const source: PlayerSource = {
      id: mediaId,
      uri: `mock://${mode}/${mediaId}`,
      mode,
      title: content.title,
      posterUrl: content.posterUrl,
      backdropUrl: content.backdropUrl,
      durationSeconds,
      isLive: mode === 'live',
    };

    const episodes = mode === 'series'
      ? [1, 2, 3, 4, 5].map((episodeNumber) => ({
          id: `${mediaId}-s1-e${episodeNumber}`,
          title: `${content.title} · Episode ${episodeNumber}`,
          seasonNumber: 1,
          episodeNumber,
          durationSeconds: 2700,
          posterUrl: content.backdropUrl,
        }))
      : [];

    return {
      source,
      content,
      mode,
      resumePositionSeconds: progress?.positionSeconds ?? Math.round((content.progress ?? 0) * (durationSeconds ?? 0)),
      audioTracks: [
        { id: 'audio-auto', label: 'Auto', isDefault: true },
        { id: 'audio-en', label: 'English', language: 'en' },
        { id: 'audio-ar', label: 'Arabic', language: 'ar' },
      ],
      subtitleTracks: [
        { id: 'sub-off', label: 'Off', isDefault: true },
        { id: 'sub-en', label: 'English', language: 'en' },
        { id: 'sub-ar', label: 'Arabic', language: 'ar' },
      ],
      selectedAudioTrackId: 'audio-auto',
      selectedSubtitleTrackId: 'sub-off',
      subtitleStyle: defaultSubtitleStyle,
      playbackSpeeds: [0.5, 0.75, 1, 1.25, 1.5, 2],
      aspectRatios: ['fit', 'fill', 'zoom', 'stretch'],
      seekThumbnails: mode === 'live' ? [] : [0, 600, 1200, 1800, 2400, 3000].map((timeSeconds) => ({ timeSeconds, imageUrl: content.backdropUrl })),
      skipIntro: mode === 'series' ? { startSeconds: 12, endSeconds: 82, label: 'Skip Intro' } : undefined,
      previousEpisode: episodes[0],
      nextEpisode: episodes[1],
      episodes,
      capabilities: capabilitiesFor(mode),
    };
  }

  async saveProgress(mediaId: string, positionSeconds: number, durationSeconds: number): Promise<void> {
    const content = await findContentItem(mediaId, this.repositories);
    if (!content || content.kind === 'live') return;
    await this.repositories.userLibraryRepository.savePlaybackProgress({
      playlistId: 'mock-xtream-premium',
      mediaId,
      mediaKind: content.kind === 'series' ? 'series' : 'movie',
      title: content.title,
      posterUrl: content.posterUrl,
      backdropUrl: content.backdropUrl,
      positionSeconds,
      durationSeconds,
    });
  }

  async clearProgress(mediaId: string): Promise<void> {
    await this.repositories.userLibraryRepository.removeContinueWatching(mediaId);
  }
}
