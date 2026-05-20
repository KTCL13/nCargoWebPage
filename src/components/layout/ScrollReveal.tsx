'use client';

import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';
import { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
}

export function ScrollReveal({ children }: ScrollRevealProps) {
  useRevealOnScroll();
  return <>{children}</>;
}
