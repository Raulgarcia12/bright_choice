/**
 * Setup Page — First-run admin account creation.
 * Accessible at /setup. Redirects to /login after setup is complete
 * or if an admin already exists.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'checking' | 'ready' | 'loading' | 'done' | 'already_done';

export default function SetupPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('checking');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // On mount: check if setup already done
    useEffect(() => {
        (async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any).rpc('has_any_admin');
            if (error) {
                // RPC might not exist yet — allow setup
                setStep('ready');
                return;
            }
            setStep(data ? 'already_done' : 'ready');
        })();
    }, []);

    async function handleSetup(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg('');
        setStep('loading');

        // 1. Sign up the user
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpErr) {
            setErrorMsg(signUpErr.message);
            setStep('ready');
            return;
        }

        const userId = signUpData.user?.id;
        if (!userId) {
            setErrorMsg('Could not retrieve user ID after signup. Please try again.');
            setStep('ready');
            return;
        }

        // 2. Claim admin role via RPC (only succeeds if no admin exists yet)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rpcData, error: rpcErr } = await (supabase as any).rpc('claim_first_admin', {
            target_user_id: userId,
        });

        if (rpcErr) {
            setErrorMsg(rpcErr.message);
            setStep('ready');
            return;
        }

        const result = rpcData as { ok: boolean; reason?: string } | null;
        if (!result.ok) {
            if (result.reason === 'admin_exists') {
                setStep('already_done');
            } else {
                setErrorMsg('Setup failed. Please try again.');
                setStep('ready');
            }
            return;
        }

        setStep('done');
        // Sign out so the user logs in cleanly
        await supabase.auth.signOut();
        setTimeout(() => navigate('/login'), 3000);
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
            {/* Background gradient blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
            </div>

            <AnimatePresence mode="wait">
                {step === 'checking' && (
                    <motion.div
                        key="checking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-3 text-muted-foreground"
                    >
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm">Checking setup status…</p>
                    </motion.div>
                )}

                {(step === 'ready' || step === 'loading') && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -24 }}
                        transition={{ duration: 0.4 }}
                        className="relative z-10 w-full max-w-md"
                    >
                        {/* Card */}
                        <div className="rounded-2xl border bg-card/90 shadow-2xl backdrop-blur-md">
                            {/* Header stripe */}
                            <div className="rounded-t-2xl bg-gradient-to-r from-primary to-primary/70 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-white/20 p-2">
                                        <ShieldCheck className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-white">Initial Setup</h1>
                                        <p className="text-xs text-white/70">Create your administrator account</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Feature pills */}
                                <div className="flex flex-wrap gap-2">
                                    {['Full admin access', 'Product management', 'User control'].map((f) => (
                                        <span
                                            key={f}
                                            className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                        >
                                            <Zap className="h-3 w-3" /> {f}
                                        </span>
                                    ))}
                                </div>

                                {errorMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                                    >
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                        {errorMsg}
                                    </motion.div>
                                )}

                                <form onSubmit={handleSetup} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="setup-email">Admin Email</Label>
                                        <Input
                                            id="setup-email"
                                            type="email"
                                            placeholder="admin@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoFocus
                                            disabled={step === 'loading'}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="setup-password">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="setup-password"
                                                type={showPw ? 'text' : 'password'}
                                                placeholder="Minimum 6 characters"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                disabled={step === 'loading'}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                tabIndex={-1}
                                            >
                                                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={step === 'loading' || !email || password.length < 6}
                                    >
                                        {step === 'loading' ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating account…
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                Create Admin Account
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <p className="text-center text-xs text-muted-foreground">
                                    This page is only active before the first admin is created.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'done' && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-4 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.1 }}
                            className="rounded-full bg-green-500/15 p-5"
                        >
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </motion.div>
                        <h2 className="text-2xl font-bold">Setup Complete! 🎉</h2>
                        <p className="max-w-xs text-muted-foreground text-sm">
                            Your admin account has been created. Redirecting to login in a moment…
                        </p>
                        <Button variant="outline" onClick={() => navigate('/login')} className="mt-2">
                            Go to Login
                        </Button>
                    </motion.div>
                )}

                {step === 'already_done' && (
                    <motion.div
                        key="already_done"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4 text-center"
                    >
                        <div className="rounded-full bg-primary/10 p-5">
                            <ShieldCheck className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Already Set Up</h2>
                        <p className="max-w-xs text-muted-foreground text-sm">
                            An admin account already exists. This page is no longer active.
                        </p>
                        <Button onClick={() => navigate('/login')} className="mt-2">
                            Go to Login
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
