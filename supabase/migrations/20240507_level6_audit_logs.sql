-- SQL MIGRATION: LEVEL 6 - AUDIT LOGS
-- Track important system events for security and compliance

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'
    entity_type TEXT NOT NULL, -- 'inquilino', 'imobiliaria', 'vistoria', 'plano'
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins can view all logs" ON public.audit_logs;
CREATE POLICY "Admins can view all logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_master', 'equipe_ef')
        )
    );

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
