import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BarChart3, Zap, Target, TrendingUp, Database, ArrowRight,
    Send, CheckCircle, ChevronDown, Sparkles, Globe2, Shield,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { analytics } from '@/lib/analytics';

/* ────────────────────────────────────────────
   Helper: Section wrapper with scroll reveal
   ──────────────────────────────────────────── */
function RevealSection({
    children,
    className = '',
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.1 });
    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.7, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.section>
    );
}

/* ────────────────────────────────────────────
   Glowing Orb Background
   ──────────────────────────────────────────── */
function GlowingOrb() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Copper orb — top‑right */}
            <div
                className="animate-float-orb absolute -top-32 right-[10%] h-[500px] w-[500px] rounded-full opacity-30"
                style={{
                    background: 'radial-gradient(circle, hsl(25, 80%, 65%) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }}
            />
            {/* Cobalt orb — bottom‑left */}
            <div
                className="animate-float-orb absolute -bottom-40 left-[5%] h-[600px] w-[600px] rounded-full opacity-20"
                style={{
                    background: 'radial-gradient(circle, hsl(215, 80%, 55%) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    animationDelay: '3s',
                }}
            />
            {/* Small accent orb */}
            <div
                className="animate-pulse-glow absolute top-[60%] right-[30%] h-[200px] w-[200px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, hsl(25, 85%, 60%) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
            />
        </div>
    );
}

/* ────────────────────────────────────────────
   Feature Card (3D tilt + glassmorphism)
   ──────────────────────────────────────────── */
function FeatureCard({
    icon: Icon,
    title,
    subtitle,
    description,
    delay = 0,
    accentColor = 'cobalt',
}: {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    description: string;
    delay?: number;
    accentColor?: 'copper' | 'cobalt';
}) {
    const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    function handleMouseMove(e: React.MouseEvent) {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
        setTilt({ x: y, y: x });
    }

    function handleMouseLeave() {
        setTilt({ x: 0, y: 0 });
    }

    const glowColor =
        accentColor === 'copper' ? 'hsl(25, 80%, 55%)' : 'hsl(215, 80%, 55%)';

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.6, delay }}
        >
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="glass-card group relative overflow-hidden p-8 transition-all duration-300"
                style={{
                    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transition: 'transform 0.15s ease-out',
                }}
            >
                {/* Hover glow */}
                <div
                    className="pointer-events-none absolute -inset-px rounded-[1rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                        background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}20, transparent 40%)`,
                    }}
                />

                <div
                    className="mb-4 inline-flex rounded-xl p-3"
                    style={{ background: `${glowColor}18` }}
                >
                    <Icon className="h-6 w-6" style={{ color: glowColor }} />
                </div>

                <h3
                    className={`mb-1 text-xs font-bold uppercase tracking-widest ${accentColor === 'copper' ? 'text-gradient-copper' : 'text-gradient-cobalt'
                        }`}
                >
                    {subtitle}
                </h3>
                <h2 className="mb-3 text-xl font-bold text-foreground">
                    {title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                </p>
            </div>
        </motion.div>
    );
}

/* ════════════════════════════════════════════
   WELCOME PAGE
   ════════════════════════════════════════════ */
export default function WelcomePage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { language } = useAppStore();
    const [form, setForm] = useState({ full_name: '', email: '', company: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.full_name || !form.email || !form.company) {
            toast({ title: t('errEmpty', language), variant: 'destructive' });
            return;
        }
        setSending(true);
        const { error } = await supabase.from('contact_requests').insert({
            full_name: form.full_name,
            email: form.email,
            company: form.company,
        });
        setSending(false);
        if (error) {
            toast({ title: t('errSend', language), variant: 'destructive' });
        } else {
            setSent(true);
            toast({ title: t('okSend', language) });
            setForm({ full_name: '', email: '', company: '' });
            analytics.contactFormSubmitted();
        }
    }

    return (
        <div className="welcome-page min-h-screen bg-background transition-colors duration-500">
            <Header />

            {/* ═══════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════ */}
            <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:pt-24 lg:pb-32 lg:pt-32">
                <GlowingOrb />

                <div className="relative z-10 mx-auto max-w-5xl text-center">
                    {/* Eyebrow badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-primary/20 bg-primary/10"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold tracking-wider text-primary">
                            {t('heroBadge', language)}
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-foreground"
                    >
                        {t('heroTitle1', language)}{' '}
                        <span className="text-gradient-copper">{t('heroTitle2', language)}</span>
                        <br />
                        {t('heroTitle3', language)}{' '}
                        <span className="text-gradient-cobalt">{t('heroTitle4', language)}</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="mx-auto mb-10 max-w-2xl text-base leading-relaxed sm:text-lg text-muted-foreground"
                    >
                        {t('heroSubtitle', language)}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
                    >
                        <Button
                            size="lg"
                            className="gap-2 rounded-xl px-8 text-sm font-semibold"
                            style={{
                                background: 'linear-gradient(135deg, hsl(25, 85%, 55%), hsl(25, 75%, 45%))',
                                color: 'white',
                                border: 'none',
                            }}
                            onClick={() => {
                                const el = document.getElementById('contact-section');
                                el?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            {t('btnDemo', language)} <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="gap-2 rounded-xl px-8 text-sm font-semibold border-primary text-primary hover:bg-primary/10"
                            onClick={() => navigate('/products?tab=compare')}
                        >
                            {t('btnComparator', language)} <BarChart3 className="h-4 w-4" />
                        </Button>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="mt-16 flex justify-center"
                    >
                        <ChevronDown
                            className="h-6 w-6 animate-bounce text-muted-foreground"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
          SECTION 2 — DATA INTELLIGENCE
          ═══════════════════════════════════════ */}
            <RevealSection className="relative px-4 py-20 sm:py-28">
                <div className="mx-auto max-w-4xl text-center">
                    <h2
                        className="mb-3 text-xs font-bold uppercase tracking-widest text-gradient-cobalt"
                    >
                        {t('dataIntEyebrow', language)}
                    </h2>
                    <h3
                        className="mb-6 text-3xl font-bold sm:text-4xl text-foreground"
                    >
                        {t('dataIntTitle1', language)}{' '}
                        <span className="text-gradient-copper">{t('dataIntTitle2', language)}</span>
                    </h3>
                    <p
                        className="mx-auto max-w-2xl text-base leading-relaxed sm:text-lg text-muted-foreground"
                    >
                        {t('dataIntDesc', language)}
                    </p>
                </div>

                {/* Stat pills */}
                <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: t('statProducts', language), value: '1,000+' },
                        { label: t('statBrands', language), value: '5+' },
                        { label: t('statRegions', language), value: '63' },
                        { label: t('statUpdates', language), value: '500+' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="glass-card p-5 text-center"
                        >
                            <div
                                className="text-2xl font-extrabold sm:text-3xl text-gradient-copper"
                            >
                                {stat.value}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </RevealSection>

            {/* ═══════════════════════════════════════
          SECTION 3 — FEATURES (3 cards)
          ═══════════════════════════════════════ */}
            <section className="px-4 py-20 sm:py-28">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Card 1: Real-Time Metrics */}
                        <FeatureCard
                            icon={Zap}
                            subtitle={t('f1Sub', language)}
                            title={t('f1Title', language)}
                            description={t('f1Desc', language)}
                            delay={0}
                            accentColor="cobalt"
                        />

                        {/* Card 2: Convenience Score */}
                        <FeatureCard
                            icon={Target}
                            subtitle={t('f2Sub', language)}
                            title={t('f2Title', language)}
                            description={t('f2Desc', language)}
                            delay={0.15}
                            accentColor="copper"
                        />

                        {/* Card 3: Accelerate Sales */}
                        <FeatureCard
                            icon={TrendingUp}
                            subtitle={t('f3Sub', language)}
                            title={t('f3Title', language)}
                            description={t('f3Desc', language)}
                            delay={0.3}
                            accentColor="cobalt"
                        />
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
          SECTION 4 — ENTERPRISE ANALYTICS
          ═══════════════════════════════════════ */}
            <RevealSection className="relative px-4 py-20 sm:py-28">
                <div className="relative z-10 mx-auto max-w-5xl">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        {/* Text */}
                        <div>
                            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-gradient-cobalt">
                                {t('anaEyebrow', language)}
                            </h2>
                            <h3 className="mb-4 text-3xl font-bold text-foreground">
                                {t('anaTitle', language)}
                            </h3>
                            <p className="mb-6 leading-relaxed text-muted-foreground">
                                {t('anaDesc', language)}
                            </p>

                            <div className="space-y-3">
                                {[
                                    { icon: Globe2, text: t('anaB1', language) },
                                    { icon: Database, text: t('anaB2', language) },
                                    { icon: Shield, text: t('anaB3', language) },
                                ].map(({ icon: Ic, text }) => (
                                    <div key={text} className="flex items-center gap-3">
                                        <div className="rounded-lg p-2 bg-primary/10">
                                            <Ic className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-sm text-foreground/70">
                                            {text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visual — dashboard mock */}
                        <div className="glass-card card-3d relative overflow-hidden p-1">
                            <div className="rounded-xl p-6 bg-card">
                                {/* Mini metric bars */}
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <div className="h-3 w-3 rounded-full bg-slate-500" />
                                </div>

                                <div className="space-y-3">
                                    {[85, 62, 94, 73, 88].map((w, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div
                                                className="h-1.5 rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${w}%`,
                                                    background: i % 2 === 0
                                                        ? 'linear-gradient(90deg, hsl(215, 90%, 55%), hsl(215, 80%, 40%))'
                                                        : 'linear-gradient(90deg, hsl(25, 85%, 60%), hsl(25, 75%, 45%))',
                                                }}
                                            />
                                            <span className="text-[10px] tabular-nums text-muted-foreground">
                                                {w}%
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Efficiency', value: '126.5', unit: 'lm/W' },
                                        { label: 'Avg Price', value: '$23.05', unit: 'USD' },
                                        { label: 'DLC Cert', value: '77%', unit: '' },
                                    ].map((m) => (
                                        <div
                                            key={m.label}
                                            className="rounded-lg p-3 text-center bg-muted/40"
                                        >
                                            <div className="text-lg font-bold text-foreground">
                                                {m.value}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {m.label} {m.unit && `(${m.unit})`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </RevealSection>

            {/* ═══════════════════════════════════════
          SECTION 5 — CONTACT / DEMO FORM
          ═══════════════════════════════════════ */}
            <section
                id="contact-section"
                className="relative px-4 py-20 sm:py-28"
            >
                <GlowingOrb />
                <div className="relative z-10 mx-auto max-w-4xl">
                    <div className="glass-card overflow-hidden">
                        <div className="grid lg:grid-cols-2">
                            {/* Left — copy */}
                            <div
                                className="flex flex-col justify-center p-8 sm:p-12 bg-muted/20"
                            >
                                <h2
                                    className="mb-4 text-2xl font-bold sm:text-3xl text-foreground"
                                >
                                    {t('ctgReady', language)}{' '}
                                    <span className="text-gradient-copper">{t('ctgBusiness', language)}</span>
                                </h2>
                                <p className="mb-6 leading-relaxed text-muted-foreground">
                                    {t('ctgDesc1', language)}
                                </p>

                                <p className="mb-8 text-sm text-muted-foreground">
                                    {t('ctgDesc2', language)}
                                </p>

                                <Button
                                    variant="outline"
                                    className="w-fit gap-2 rounded-xl border-primary text-primary hover:bg-primary/10"
                                    onClick={() => navigate('/')}
                                >
                                    {t('btnComparator', language)} <BarChart3 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Right — form */}
                            <div className="p-8 sm:p-12">
                                <h3
                                    className="mb-6 text-lg font-bold text-foreground"
                                >
                                    {t('formTitle', language)}
                                </h3>

                                {sent ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center gap-4 py-12 text-center"
                                    >
                                        <CheckCircle className="h-12 w-12 text-emerald-500" />
                                        <p className="font-semibold text-foreground">
                                            {t('formSuccess', language)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {t('formSuccessDesc', language)}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                {t('formName', language)}
                                            </label>
                                            <Input
                                                value={form.full_name}
                                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                                placeholder={t('formNamePh', language)}
                                                className="rounded-lg border-none bg-muted/30 text-foreground"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                {t('formEmail', language)}
                                            </label>
                                            <Input
                                                type="email"
                                                value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                placeholder={t('formEmailPh', language)}
                                                className="rounded-lg border-none bg-muted/30 text-foreground"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                {t('formCompany', language)}
                                            </label>
                                            <Input
                                                value={form.company}
                                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                                                placeholder={t('formCompanyPh', language)}
                                                className="rounded-lg border-none bg-muted/30 text-foreground"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={sending}
                                            className="w-full gap-2 rounded-xl text-sm font-semibold text-white"
                                            style={{
                                                background: 'linear-gradient(135deg, hsl(25, 85%, 55%), hsl(25, 75%, 45%))',
                                            }}
                                        >
                                            {sending ? t('formSending', language) : t('formTitle', language)}
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════ */}
            <footer
                className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground"
            >
                © {new Date().getFullYear()} LEDCO — Bright Choice. {t('rights', language)}
            </footer>
        </div>
    );
}
