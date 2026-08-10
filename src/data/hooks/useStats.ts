import { useQuery } from '@tanstack/react-query';
import { qk, staleTime } from '@/data/queryKeys';
import { statsRepository, type PlatformCounts } from '@/data/repositories/stats.repo';

export function usePlatformStats() {
  return useQuery<PlatformCounts>({
    queryKey: qk.stats.platform(),
    queryFn: () => statsRepository.platformCounts(),
    staleTime: staleTime.static,
  });
}
