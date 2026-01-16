import { ArrowUp, ArrowDown, Gift, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const TYPE_CONFIG = {
  earned: { icon: ArrowUp, color: 'text-green-500', label: 'Earned' },
  redeemed: { icon: Gift, color: 'text-blue-500', label: 'Redeemed' },
  bonus: { icon: Gift, color: 'text-purple-500', label: 'Bonus' },
  expired: { icon: Clock, color: 'text-red-500', label: 'Expired' },
};

export function PointsHistory() {
  const { transactions, loading } = useLoyaltyPoints();

  if (loading) {
    return (
      <Card className="bg-card border-border animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Points History</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No transactions yet. Book your first movie to earn points!
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const config = TYPE_CONFIG[transaction.transaction_type];
              const Icon = config.icon;
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-full bg-muted', config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(transaction.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'font-bold',
                    transaction.points > 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {transaction.points > 0 ? '+' : ''}{transaction.points}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
