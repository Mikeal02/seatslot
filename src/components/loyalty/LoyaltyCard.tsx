import { Crown, Gift, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { cn } from '@/lib/utils';

const TIER_COLORS = {
  bronze: 'from-amber-700 to-amber-500',
  silver: 'from-gray-400 to-gray-300',
  gold: 'from-yellow-500 to-amber-300',
  platinum: 'from-slate-600 to-slate-400',
};

const TIER_ICONS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

export function LoyaltyCard() {
  const { points, getNextTier, loading, TIER_THRESHOLDS } = useLoyaltyPoints();

  if (loading || !points) {
    return (
      <Card className="bg-card border-border animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const nextTier = getNextTier();
  const tier = points.tier;
  const tierColor = TIER_COLORS[tier];

  // Calculate progress to next tier
  let progress = 100;
  if (nextTier) {
    const currentThreshold = TIER_THRESHOLDS[tier];
    const nextThreshold = TIER_THRESHOLDS[nextTier.tier.toLowerCase() as keyof typeof TIER_THRESHOLDS];
    const range = nextThreshold - currentThreshold;
    const current = points.lifetime_points - currentThreshold;
    progress = Math.min((current / range) * 100, 100);
  }

  return (
    <Card className="overflow-hidden">
      {/* Gradient Header */}
      <div className={cn('p-4 bg-gradient-to-r text-white', tierColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{TIER_ICONS[tier]}</span>
            <div>
              <p className="text-xs opacity-80">Rewards Tier</p>
              <h3 className="font-bold capitalize">{tier} Member</h3>
            </div>
          </div>
          <Crown className="h-8 w-8 opacity-50" />
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Points Balance */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Available Points</span>
          </div>
          <span className="text-2xl font-bold text-primary">{points.total_points}</span>
        </div>

        {/* Points Value */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Points Value</span>
          <span className="font-medium">₹{Math.floor(points.total_points / 10)} discount available</span>
        </div>

        {/* Lifetime Points */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Lifetime Points</span>
          <span className="font-medium">{points.lifetime_points}</span>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Next: {nextTier.tier}
              </span>
              <span className="font-medium">{nextTier.pointsNeeded} points to go</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Benefits */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Your Benefits:</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              <Gift className="h-3 w-3 mr-1" />
              1pt per ₹1 spent
            </Badge>
            {tier !== 'bronze' && (
              <Badge variant="secondary" className="text-xs">
                Priority Booking
              </Badge>
            )}
            {(tier === 'gold' || tier === 'platinum') && (
              <Badge variant="secondary" className="text-xs">
                Free Upgrades
              </Badge>
            )}
            {tier === 'platinum' && (
              <Badge variant="secondary" className="text-xs">
                Exclusive Previews
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
