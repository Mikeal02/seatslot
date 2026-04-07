import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Ticket, Home, Film } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setErrorMsg('Invalid payment session.');
      return;
    }
    // Animate progress bar
    const interval = setInterval(() => setProgress(p => Math.min(p + 2, 90)), 100);
    verifyPayment(sessionId).finally(() => clearInterval(interval));
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-booking-payment', {
        body: { sessionId },
      });

      if (error) throw error;

      if (data?.success && data?.bookingId) {
        setProgress(100);
        setStatus('success');
        setTimeout(() => {
          navigate(`/booking-confirmation/${data.bookingId}`);
        }, 1800);
      } else {
        setStatus('error');
        setErrorMsg(data?.error || 'Payment verification failed.');
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to verify payment.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          className="text-center max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {status === 'verifying' && (
            <div className="space-y-8">
              <motion.div
                className="mx-auto w-20 h-20 rounded-2xl cinema-gradient flex items-center justify-center shadow-2xl shadow-primary/30"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Ticket className="h-9 w-9 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black mb-2">Confirming Your Booking</h1>
                <p className="text-muted-foreground text-sm">
                  Verifying payment and reserving your seats...
                </p>
              </div>
              <div className="max-w-xs mx-auto">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center"
              >
                <CheckCircle className="h-12 w-12 text-green-500" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-2xl font-black mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground text-sm">
                  Redirecting to your ticket...
                </p>
              </motion.div>
              <Progress value={100} className="h-2 max-w-xs mx-auto" />
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <XCircle className="h-16 w-16 text-destructive mx-auto" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black mb-2">Payment Issue</h1>
                <p className="text-muted-foreground text-sm">{errorMsg}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
                <Button asChild className="cinema-gradient rounded-full">
                  <Link to="/movies">
                    <Film className="h-4 w-4 mr-2" />
                    Browse Movies
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
