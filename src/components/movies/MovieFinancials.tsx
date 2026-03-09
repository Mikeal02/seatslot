import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Percent, Award, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MovieFinancialsProps {
  budget?: number;
  revenue?: number;
  budgetFormatted?: string | null;
  revenueFormatted?: string | null;
  profitFormatted?: string | null;
  roi?: number | null;
  revenueMultiplier?: number | null;
  isProfitable?: boolean;
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {value}{suffix}
    </motion.span>
  );
}

function GaugeRing({ percent, color, size = 80, label }: { percent: number; color: string; size?: number; label: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const capped = Math.min(Math.max(percent, 0), 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <motion.circle
            cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (circumference * capped / 100) }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black tracking-tight">{Math.round(capped)}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function MovieFinancials({ budget, revenue, budgetFormatted, revenueFormatted, profitFormatted, roi, revenueMultiplier, isProfitable }: MovieFinancialsProps) {
  if (!budget && !revenue) return null;

  const profit = (revenue || 0) - (budget || 0);
  const profitable = isProfitable ?? profit > 0;
  const calculatedRoi = roi ?? (budget && budget > 0 ? Math.round(((profit / budget) * 100)) : null);
  const multiplier = revenueMultiplier ?? (budget && budget > 0 ? Math.round(((revenue || 0) / budget) * 10) / 10 : null);

  // Revenue as percent of max(budget, revenue) for bar
  const maxVal = Math.max(budget || 0, revenue || 0);
  const budgetPercent = maxVal > 0 ? ((budget || 0) / maxVal) * 100 : 0;
  const revenuePercent = maxVal > 0 ? ((revenue || 0) / maxVal) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg cinema-gradient flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Box Office Performance</h3>
        </div>
        {profitable && multiplier && multiplier > 1 && (
          <Badge className="bg-accent/10 text-accent border-accent/20 font-bold text-xs gap-1">
            <Zap className="h-3 w-3" />
            {multiplier}x Return
          </Badge>
        )}
      </div>

      {/* Main stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {budget && budget > 0 && (
          <motion.div
            className="relative overflow-hidden rounded-xl bg-card border border-border/40 p-4 group hover:border-primary/30 transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="uppercase tracking-wider font-medium">Production Budget</span>
            </div>
            <p className="text-2xl font-black tracking-tight">{budgetFormatted || `$${budget.toLocaleString()}`}</p>
            <p className="text-[10px] text-muted-foreground mt-1">${budget.toLocaleString()}</p>
          </motion.div>
        )}

        {revenue && revenue > 0 && (
          <motion.div
            className="relative overflow-hidden rounded-xl bg-card border border-border/40 p-4 group hover:border-primary/30 transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 cinema-gradient" />
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="uppercase tracking-wider font-medium">Worldwide Gross</span>
            </div>
            <p className="text-2xl font-black tracking-tight cinema-gradient-text">{revenueFormatted || `$${revenue.toLocaleString()}`}</p>
            <p className="text-[10px] text-muted-foreground mt-1">${revenue.toLocaleString()}</p>
          </motion.div>
        )}

        {budget && budget > 0 && revenue && revenue > 0 && (
          <motion.div
            className={`relative overflow-hidden rounded-xl border p-4 ${
              profitable ? 'bg-accent/5 border-accent/20' : 'bg-destructive/5 border-destructive/20'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${profitable ? 'bg-accent' : 'bg-destructive'}`} />
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              {profitable ? <TrendingUp className="h-3.5 w-3.5 text-accent" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
              <span className="uppercase tracking-wider font-medium">{profitable ? 'Net Profit' : 'Net Loss'}</span>
            </div>
            <p className={`text-2xl font-black tracking-tight ${profitable ? 'text-accent' : 'text-destructive'}`}>
              {profitable ? '+' : '-'}{profitFormatted || `$${Math.abs(profit).toLocaleString()}`}
            </p>
            {calculatedRoi !== null && (
              <p className={`text-xs mt-1 font-bold ${profitable ? 'text-accent/80' : 'text-destructive/80'}`}>
                {profitable ? '+' : ''}{calculatedRoi}% ROI
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* Visual analytics row */}
      {budget && budget > 0 && revenue && revenue > 0 && (
        <motion.div
          className="flex flex-wrap justify-center gap-6 sm:gap-10 py-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <GaugeRing
            percent={Math.min(revenuePercent, 100)}
            color={profitable ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'}
            label="Revenue vs Budget"
          />
          {calculatedRoi !== null && (
            <GaugeRing
              percent={Math.min(Math.abs(calculatedRoi) / 10, 100)}
              color={profitable ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
              label={`${calculatedRoi > 0 ? '+' : ''}${calculatedRoi}% ROI`}
            />
          )}
          {multiplier !== null && (
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${profitable ? 'border-accent/40 bg-accent/5' : 'border-destructive/40 bg-destructive/5'}`}>
                  <span className={`text-lg font-black ${profitable ? 'text-accent' : 'text-destructive'}`}>
                    {multiplier}x
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Multiplier</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Comparison bar */}
      {budget && budget > 0 && revenue && revenue > 0 && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Budget</span>
              <span className="font-bold">{budgetFormatted}</span>
            </div>
            <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
                initial={{ width: 0 }}
                animate={{ width: `${budgetPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Revenue</span>
              <span className="font-bold cinema-gradient-text">{revenueFormatted}</span>
            </div>
            <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full cinema-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${revenuePercent}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.7 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
