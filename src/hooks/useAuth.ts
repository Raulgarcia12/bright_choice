import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'analyst' | 'viewer' | null;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        // Check role - defer to avoid deadlock
        setTimeout(() => checkRole(session.user.id), 0);
      } else {
        setIsAdmin(false);
        setUserRole(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkRole(userId: string) {
    // Fetch the user's role(s)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (roles && roles.length > 0) {
      // Highest privilege wins: admin > analyst > viewer
      const roleList = roles.map((r) => r.role);
      if (roleList.includes('admin')) {
        setIsAdmin(true);
        setUserRole('admin');
      } else if (roleList.includes('analyst')) {
        setIsAdmin(false);
        setUserRole('analyst');
      } else {
        setIsAdmin(false);
        setUserRole('viewer');
      }
    } else {
      setIsAdmin(false);
      setUserRole('viewer'); // Default to viewer if no role assigned
    }
    setLoading(false);
  }

  /** Check if user has at least the given role level */
  function hasPermission(minRole: 'viewer' | 'analyst' | 'admin'): boolean {
    if (!userRole) return false;
    const hierarchy: Record<string, number> = { viewer: 1, analyst: 2, admin: 3 };
    return (hierarchy[userRole] || 0) >= (hierarchy[minRole] || 0);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    setUserRole(null);
  }

  return { session, isAdmin, userRole, hasPermission, loading, signIn, signUp, signOut };
}

