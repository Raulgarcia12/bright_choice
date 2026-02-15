import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { language } = useAppStore();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: t('loginError', language), variant: 'destructive' });
    } else {
      navigate('/admin');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden border shadow-lg">
            <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/50" />
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 rounded-xl bg-primary/10 p-3 w-fit">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">{t('loginTitle', language)}</CardTitle>
              <CardDescription>
                {language === 'en' ? 'Access the admin dashboard' : 'Accede al panel de administración'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('email', language)}</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>{t('password', language)}</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('loading', language) : t('login', language)}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
