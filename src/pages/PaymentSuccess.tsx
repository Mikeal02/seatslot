import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setErrorMsg('Invalid payment session.');
      return;
    }
    verifyPayment(sessionId);
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-booking-payment', {
        body: { sessionId },
      });

      if (error) throw error;

      if (data?.success && data?.bookingId) {
        setStatus('success');
        // Redirect to confirmation after brief success display
        setTimeout(() => {
          navigate(`/booking-confirmation/${data.bookingId}`);
        }, 2000);
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
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {status === 'verifying' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Verifying Payment...</h1>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment and finalize your booking.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Redirecting to your booking confirmation...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment Issue</h1>
              <p className="text-muted-foreground mb-6">{errorMsg}</p>
              <div className="flex gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link to="/">Go Home</Link>
                </Button>
                <Button asChild>
                  <Link to="/movies">Browse Movies</Link>
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
