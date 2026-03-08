import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface MovieFinancialsProps {
  budget?: number;
  revenue?: number;
  budgetFormatted?: string | null;
  revenueFormatted?: string | null;
  profitFormatted?: string | null;
}

export function MovieFinancials({ budget, revenue, budgetFormatted, revenueFormatted, profitFormatted }: MovieFinancialsProps) {
  if (!budget && !revenue) return null;

  const profit = (revenue || 0) - (budget || 0);
  const isProfitable = profit > 0;
  const roi = budget && budget > 0 ? ((profit / budget) * 100).toFixed(0) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg cinema-gradient flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">Box Office</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Budget */}
        {budget && budget > 0 && (
          <motion.div
            className="relative overflow-hidden rounded-xl bg-card border border-border/40 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              Budget
            </div>
            <p className="text-xl font-black tracking-tight">{budgetFormatted || `$${budget.toLocaleString()}`}</p>
          </motion.div>
        )}

        {/* Revenue */}
        {revenue && revenue > 0 && (
          <motion.div
            className="relative overflow-hidden rounded-xl bg-card border border-border/40 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 cinema-gradient" />
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Revenue
            </div>
            <p className="text-xl font-black tracking-tight cinema-gradient-text">{revenueFormatted || `$${revenue.toLocaleString()}`}</p>
          </motion.div>
        )}

        {/* Profit / ROI */}
        {budget && budget > 0 && revenue && revenue > 0 && (
          <motion.div
            className={`relative overflow-hidden rounded-xl border p-4 ${
              isProfitable ? 'bg-accent/5 border-accent/20' : 'bg-destructive/5 border-destructive/20'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${isProfitable ? 'bg-accent' : 'bg-destructive'}`} />
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              {isProfitable ? <TrendingUp className="h-3.5 w-3.5 text-accent" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
              {isProfitable ? 'Profit' : 'Loss'}
            </div>
            <p className={`text-xl font-black tracking-tight ${isProfitable ? 'text-accent' : 'text-destructive'}`}>
              {profitFormatted || `$${Math.abs(profit).toLocaleString()}`}
            </p>
            {roi && (
              <p className={`text-xs mt-1 font-semibold ${isProfitable ? 'text-accent/80' : 'text-destructive/80'}`}>
                {isProfitable ? '+' : ''}{roi}% ROI
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* Revenue bar visualization */}
      {budget && budget > 0 && revenue && revenue > 0 && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            <span>Budget</span>
            <span>Revenue</span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full cinema-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((revenue / Math.max(budget, revenue)) * 100, 100)}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
            />
            <div
              className="absolute inset-y-0 left-0 border-r-2 border-foreground/30"
              style={{ width: `${(budget / Math.max(budget, revenue)) * 100}%` }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
