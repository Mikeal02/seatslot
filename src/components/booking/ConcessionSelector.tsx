import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingBag, Popcorn, Coffee, Package, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ConcessionItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
}

export interface SelectedConcession {
  item: ConcessionItem;
  quantity: number;
}

interface ConcessionSelectorProps {
  selectedItems: SelectedConcession[];
  onItemsChange: (items: SelectedConcession[]) => void;
}

const categoryConfig: Record<string, { icon: React.ReactNode; emoji: string; gradient: string }> = {
  snacks: { icon: <Popcorn className="h-4 w-4" />, emoji: '🍿', gradient: 'from-amber-500/20 to-orange-500/10' },
  beverages: { icon: <Coffee className="h-4 w-4" />, emoji: '☕', gradient: 'from-blue-500/20 to-cyan-500/10' },
  combos: { icon: <Package className="h-4 w-4" />, emoji: '🎁', gradient: 'from-purple-500/20 to-pink-500/10' },
};

export function ConcessionSelector({ selectedItems, onItemsChange }: ConcessionSelectorProps) {
  const [items, setItems] = useState<ConcessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('concession_items')
      .select('*')
      .eq('is_available', true)
      .order('category')
      .order('price');

    setItems((data || []) as ConcessionItem[]);
    setLoading(false);
  };

  const getQuantity = (itemId: string) => {
    return selectedItems.find(s => s.item.id === itemId)?.quantity || 0;
  };

  const updateQuantity = (item: ConcessionItem, delta: number) => {
    const current = getQuantity(item.id);
    const newQty = Math.max(0, Math.min(10, current + delta));

    if (newQty === 0) {
      onItemsChange(selectedItems.filter(s => s.item.id !== item.id));
    } else {
      const existing = selectedItems.find(s => s.item.id === item.id);
      if (existing) {
        onItemsChange(selectedItems.map(s => s.item.id === item.id ? { ...s, quantity: newQty } : s));
      } else {
        onItemsChange([...selectedItems, { item, quantity: newQty }]);
      }
    }
  };

  const totalAmount = selectedItems.reduce((sum, s) => sum + s.item.price * s.quantity, 0);
  const totalItems = selectedItems.reduce((sum, s) => sum + s.quantity, 0);
  const categories = [...new Set(items.map(i => i.category))];

  if (loading) {
    return (
      <Card className="bg-card border-border/30 glow-card rounded-2xl">
        <CardContent className="p-8 text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
            <Sparkles className="h-8 w-8 text-primary/40 mx-auto" />
          </motion.div>
          <p className="text-sm text-muted-foreground mt-3">Loading treats...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/30 glow-card rounded-2xl overflow-hidden">
      <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
        <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <span>Add Snacks & Drinks</span>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-normal mt-0.5">Make your movie experience complete</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-5">
        <Tabs defaultValue={categories[0] || 'snacks'}>
          <TabsList className="w-full grid h-10 sm:h-11 bg-muted/30 rounded-xl p-1" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
            {categories.map(cat => {
              const config = categoryConfig[cat];
              return (
                <TabsTrigger key={cat} value={cat} className="capitalize text-[10px] sm:text-xs gap-1.5 rounded-lg data-[state=active]:shadow-md">
                  {config?.icon}
                  <span className="hidden sm:inline">{cat}</span>
                  <span className="sm:hidden">{config?.emoji}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map(cat => {
            const config = categoryConfig[cat];
            return (
              <TabsContent key={cat} value={cat} className="space-y-2 mt-4">
                {items.filter(i => i.category === cat).map((item, idx) => {
                  const qty = getQuantity(item.id);
                  const isAdded = qty > 0;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className={cn(
                        "group flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-300",
                        isAdded 
                          ? `bg-gradient-to-r ${config?.gradient} border-primary/30 shadow-sm` 
                          : "bg-muted/20 border-border/30 hover:border-primary/20 hover:bg-muted/30"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs sm:text-sm truncate">{item.name}</p>
                          {isAdded && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <Badge className="bg-primary/20 text-primary text-[8px] px-1.5 py-0 border-0">Added</Badge>
                            </motion.div>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                        )}
                        <p className="text-sm sm:text-base font-black cinema-gradient-text mt-1">₹{item.price}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {qty > 0 ? (
                          <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 bg-background/50 rounded-lg p-0.5 border border-border/30"
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => updateQuantity(item, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <motion.span 
                              key={qty}
                              initial={{ scale: 1.3 }}
                              animate={{ scale: 1 }}
                              className="w-6 text-center text-sm font-black"
                            >
                              {qty}
                            </motion.span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary"
                              onClick={() => updateQuantity(item, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs px-3 rounded-lg border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                            onClick={() => updateQuantity(item, 1)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </TabsContent>
            );
          })}
        </Tabs>

        <AnimatePresence>
          {totalItems > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Separator className="my-4 opacity-30" />
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/20 border border-border/20">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {totalItems} item{totalItems !== 1 ? 's' : ''} added
                  </span>
                </div>
                <Badge className="cinema-gradient text-primary-foreground px-4 py-1.5 text-sm font-black shadow-lg shadow-primary/20 rounded-full">
                  ₹{totalAmount}
                </Badge>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
