// src/components/ui/Icons.tsx
type IconProps = { className?: string; 'aria-hidden'?: boolean | 'true' | 'false' };

export const Icons = {
    User: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'w-5 h-5'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    ArrowRight: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'w-5 h-5'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    ),
    Shield: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'w-7 h-7'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    Clock: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'w-7 h-7'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    Plane: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'w-6 h-6'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
    ),
    Menu: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className ?? 'w-6 h-6'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    Close: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className ?? 'w-6 h-6'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    ),
    Home: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'w-6 h-6'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    Users: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'w-6 h-6'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    ShieldCheck: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'w-6 h-6'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
        </svg>
    ),
    CreditCard: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'w-6 h-6'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
        </svg>
    ),
    Rocket: ({ className, ...rest }: IconProps) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'w-6 h-6'} aria-hidden={rest['aria-hidden'] ?? 'true'}>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
    ),
};
