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
                <h2 className="mb-3 text-xl font-bold" style={{ color: 'hsl(210, 40%, 98%)' }}>
                    {title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(215, 16%, 60%)' }}>
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
    const [form, setForm] = useState({ full_name: '', email: '', company: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.full_name || !form.email || !form.company) {
            toast({ title: 'Please fill in all fields', variant: 'destructive' });
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
            toast({ title: 'Error sending request. Please try again.', variant: 'destructive' });
        } else {
            setSent(true);
            toast({ title: 'Demo request sent successfully!' });
            setForm({ full_name: '', email: '', company: '' });
        }
    }

    return (
        <div className="welcome-page min-h-screen" style={{ background: 'hsl(222.2, 84%, 4.9%)' }}>
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
                        className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                        style={{
                            background: 'hsla(215, 80%, 55%, 0.12)',
                            border: '1px solid hsla(215, 80%, 55%, 0.25)',
                        }}
                    >
                        <Sparkles className="h-3.5 w-3.5" style={{ color: 'hsl(215, 90%, 60%)' }} />
                        <span className="text-xs font-semibold tracking-wider" style={{ color: 'hsl(215, 90%, 70%)' }}>
                            LEDC — BRIGHT CHOICE
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
                        style={{ color: 'hsl(210, 40%, 98%)' }}
                    >
                        TRANSFORMING NORTH AMERICAN{' '}
                        <span className="text-gradient-copper">COMMERCIAL LIGHTING</span>
                        <br />
                        WITH{' '}
                        <span className="text-gradient-cobalt">DATA PRECISION</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="mx-auto mb-10 max-w-2xl text-base leading-relaxed sm:text-lg"
                        style={{ color: 'hsl(215, 16%, 60%)' }}
                    >
                        Technical business intelligence that transforms how you select, compare,
                        and sell commercial LED products — enabling faster decisions and increased revenue.
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
                            Solicitar Demo <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="gap-2 rounded-xl px-8 text-sm font-semibold"
                            style={{
                                borderColor: 'hsl(215, 80%, 40%)',
                                color: 'hsl(215, 90%, 70%)',
                                background: 'hsla(215, 80%, 40%, 0.1)',
                            }}
                            onClick={() => navigate('/')}
                        >
                            Probar el Comparador <BarChart3 className="h-4 w-4" />
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
                            className="h-6 w-6 animate-bounce"
                            style={{ color: 'hsl(215, 16%, 46%)' }}
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
                        Data Intelligence for Commercial Lighting
                    </h2>
                    <h3
                        className="mb-6 text-3xl font-bold sm:text-4xl"
                        style={{ color: 'hsl(210, 40%, 98%)' }}
                    >
                        Intelligence that Drives{' '}
                        <span className="text-gradient-copper">Precision</span>
                    </h3>
                    <p
                        className="mx-auto max-w-2xl text-base leading-relaxed sm:text-lg"
                        style={{ color: 'hsl(215, 16%, 60%)' }}
                    >
                        LEDCO is a data-intelligence platform designed for companies who want to transform
                        how commercial lighting decisions are made. By combining analytics, product comparison,
                        and regional market insights, LEDCO empowers professionals to move from guesswork
                        to precision.
                    </p>
                </div>

                {/* Stat pills */}
                <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: 'Products Tracked', value: '1,000+' },
                        { label: 'Brands Monitored', value: '3+' },
                        { label: 'US & Canada Regions', value: '63' },
                        { label: 'Spec Updates / Month', value: '500+' },
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
                            <div className="mt-1 text-xs" style={{ color: 'hsl(215, 16%, 55%)' }}>
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
                            subtitle="Real-Time Performance Metrics"
                            title="Actionable Data, Zero Guesswork."
                            description="Leverage real-time performance analytics on technical metrics—price, efficiency, and lumen output—to make instant, data-driven purchasing decisions."
                            delay={0}
                            accentColor="cobalt"
                        />

                        {/* Card 2: Convenience Score */}
                        <FeatureCard
                            icon={Target}
                            subtitle="The Convenience Score Insight"
                            title="Optimize Decisions with the Convenience Score."
                            description="A proprietary, weighted algorithm that ranks product performance, ensuring you select the optimal solution for every regional requirement in North America."
                            delay={0.15}
                            accentColor="copper"
                        />

                        {/* Card 3: Accelerate Sales */}
                        <FeatureCard
                            icon={TrendingUp}
                            subtitle="Accelerate North American Market Sales"
                            title="Sell Better, Faster, with Technical Precision."
                            description="Gain regional market insights that translate directly into faster sell-through, greater presence, and increased revenue in the vast North American LED market."
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
                                Enterprise-Ready Analytics
                            </h2>
                            <h3 className="mb-4 text-3xl font-bold" style={{ color: 'hsl(210, 40%, 98%)' }}>
                                BI Tools for Modern Lighting Operations.
                            </h3>
                            <p className="mb-6 leading-relaxed" style={{ color: 'hsl(215, 16%, 60%)' }}>
                                A centralized data dashboard and analytics platform tailored for lighting
                                manufacturers to monitor performance and predict market demand.
                            </p>

                            <div className="space-y-3">
                                {[
                                    { icon: Globe2, text: 'North American market coverage (US + Canada)' },
                                    { icon: Database, text: 'Real-time product tracking & change detection' },
                                    { icon: Shield, text: 'Enterprise-grade security & role-based access' },
                                ].map(({ icon: Ic, text }) => (
                                    <div key={text} className="flex items-center gap-3">
                                        <div
                                            className="rounded-lg p-2"
                                            style={{ background: 'hsla(215, 80%, 40%, 0.15)' }}
                                        >
                                            <Ic className="h-4 w-4" style={{ color: 'hsl(215, 90%, 60%)' }} />
                                        </div>
                                        <span className="text-sm" style={{ color: 'hsl(215, 16%, 70%)' }}>
                                            {text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visual — dashboard mock */}
                        <div className="glass-card card-3d relative overflow-hidden p-1">
                            <div
                                className="rounded-xl p-6"
                                style={{
                                    background:
                                        'linear-gradient(135deg, hsla(220, 25%, 8%, 0.8), hsla(220, 25%, 14%, 0.8))',
                                }}
                            >
                                {/* Mini metric bars */}
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ background: 'hsl(25, 85%, 60%)' }} />
                                    <div className="h-3 w-3 rounded-full" style={{ background: 'hsl(215, 90%, 60%)' }} />
                                    <div className="h-3 w-3 rounded-full" style={{ background: 'hsl(215, 16%, 35%)' }} />
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
                                            <span className="text-[10px] tabular-nums" style={{ color: 'hsl(215, 16%, 50%)' }}>
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
                                            className="rounded-lg p-3 text-center"
                                            style={{ background: 'hsla(215, 19%, 20%, 0.5)' }}
                                        >
                                            <div className="text-lg font-bold" style={{ color: 'hsl(210, 40%, 98%)' }}>
                                                {m.value}
                                            </div>
                                            <div className="text-[10px]" style={{ color: 'hsl(215, 16%, 50%)' }}>
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
                                className="flex flex-col justify-center p-8 sm:p-12"
                                style={{
                                    background:
                                        'linear-gradient(135deg, hsla(25, 75%, 50%, 0.08), hsla(215, 80%, 40%, 0.08))',
                                }}
                            >
                                <h2
                                    className="mb-4 text-2xl font-bold sm:text-3xl"
                                    style={{ color: 'hsl(210, 40%, 98%)' }}
                                >
                                    Ready to Transform Your{' '}
                                    <span className="text-gradient-copper">Lighting Business?</span>
                                </h2>
                                <p className="mb-6 leading-relaxed" style={{ color: 'hsl(215, 16%, 60%)' }}>
                                    Join the leaders leveraging data precision in North America.
                                </p>

                                <p className="mb-8 text-sm" style={{ color: 'hsl(215, 16%, 50%)' }}>
                                    Explora nuestro comparador de productos LED con métricas técnicas en tiempo real.
                                </p>

                                <Button
                                    variant="outline"
                                    className="w-fit gap-2 rounded-xl"
                                    style={{
                                        borderColor: 'hsl(215, 80%, 40%)',
                                        color: 'hsl(215, 90%, 70%)',
                                        background: 'hsla(215, 80%, 40%, 0.1)',
                                    }}
                                    onClick={() => navigate('/')}
                                >
                                    Probar el Comparador <BarChart3 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Right — form */}
                            <div className="p-8 sm:p-12">
                                <h3
                                    className="mb-6 text-lg font-bold"
                                    style={{ color: 'hsl(210, 40%, 98%)' }}
                                >
                                    Registrarse para Demo
                                </h3>

                                {sent ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center gap-4 py-12 text-center"
                                    >
                                        <CheckCircle className="h-12 w-12" style={{ color: 'hsl(145, 63%, 42%)' }} />
                                        <p className="font-semibold" style={{ color: 'hsl(210, 40%, 98%)' }}>
                                            ¡Solicitud enviada!
                                        </p>
                                        <p className="text-sm" style={{ color: 'hsl(215, 16%, 60%)' }}>
                                            Nos pondremos en contacto contigo pronto.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium" style={{ color: 'hsl(215, 16%, 60%)' }}>
                                                Nombre completo
                                            </label>
                                            <Input
                                                value={form.full_name}
                                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                                placeholder="Juan Pérez"
                                                className="rounded-lg border-none"
                                                style={{
                                                    background: 'hsla(215, 19%, 18%, 0.8)',
                                                    color: 'hsl(210, 40%, 98%)',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium" style={{ color: 'hsl(215, 16%, 60%)' }}>
                                                Email corporativo
                                            </label>
                                            <Input
                                                type="email"
                                                value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                placeholder="juan@empresa.com"
                                                className="rounded-lg border-none"
                                                style={{
                                                    background: 'hsla(215, 19%, 18%, 0.8)',
                                                    color: 'hsl(210, 40%, 98%)',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium" style={{ color: 'hsl(215, 16%, 60%)' }}>
                                                Empresa
                                            </label>
                                            <Input
                                                value={form.company}
                                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                                                placeholder="Empresa S.A."
                                                className="rounded-lg border-none"
                                                style={{
                                                    background: 'hsla(215, 19%, 18%, 0.8)',
                                                    color: 'hsl(210, 40%, 98%)',
                                                }}
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={sending}
                                            className="w-full gap-2 rounded-xl text-sm font-semibold"
                                            style={{
                                                background: 'linear-gradient(135deg, hsl(25, 85%, 55%), hsl(25, 75%, 45%))',
                                                color: 'white',
                                            }}
                                        >
                                            {sending ? 'Enviando...' : 'Solicitar Demo'}
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
                className="border-t px-4 py-8 text-center text-xs"
                style={{
                    borderColor: 'hsla(215, 19%, 20%, 0.5)',
                    color: 'hsl(215, 16%, 40%)',
                }}
            >
                © {new Date().getFullYear()} LEDCO — Bright Choice. All rights reserved.
            </footer>
        </div>
    );
}
