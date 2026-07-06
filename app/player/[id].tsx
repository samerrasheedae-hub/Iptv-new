import { PremiumPlayer } from '@/components/player/PremiumPlayer';
import { useLocalSearchParams } from 'expo-router';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PremiumPlayer mediaId={id ?? ''} />;
}
