import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingBag, Popcorn, Coffee, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

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

const categoryIcons: Record<string, React.ReactNode> = {
  snacks: <Popcorn className="h-4 w-4" />,
  beverages: <Coffee className="h-4 w-4" />,
  combos: <Package className="h-4 w-4" />,
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

  if (loading) return null;

  return (
    <Card className="bg-card border-border glow-card">
      <CardHeader className="px-4 sm:px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          Add Snacks & Drinks
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs defaultValue={categories[0] || 'snacks'}>
          <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="capitalize text-xs sm:text-sm gap-1">
                {categoryIcons[cat]}
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat} value={cat} className="space-y-2 mt-3">
              {items.filter(i => i.category === cat).map((item, idx) => {
                const qty = getQuantity(item.id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                      <p className="text-xs sm:text-sm font-semibold text-primary mt-0.5">₹{item.price}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {qty > 0 ? (
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1"
                        >
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6 sm:h-7 sm:w-7"
                            onClick={() => updateQuantity(item, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-5 text-center text-xs sm:text-sm font-bold">{qty}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6 sm:h-7 sm:w-7"
                            onClick={() => updateQuantity(item, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5"
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
          ))}
        </Tabs>

        <AnimatePresence>
          {totalItems > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Separator className="my-3" />
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </span>
                <Badge className="cinema-gradient text-primary-foreground px-3">
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
