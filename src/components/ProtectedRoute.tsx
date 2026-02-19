/**
 * ProtectedRoute Component
 * Gates access based on authentication and role.
 */
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
    children: ReactNode;
    minRole?: 'viewer' | 'analyst' | 'admin';
}

export default function ProtectedRoute({ children, minRole = 'viewer' }: ProtectedRouteProps) {
    const { session, hasPermission, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="h-10 w-10 rounded-full border-3 border-primary border-t-transparent"
                />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    if (!hasPermission(minRole)) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md rounded-xl border bg-card p-8 text-center shadow-lg"
                >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        You need <span className="font-semibold text-foreground">{minRole}</span> or higher permissions to access this page.
                    </p>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}
