import { Metadata } from 'next';
import { ContratosClient } from '@/components/admin/contratos/ContratosClient';

export const metadata: Metadata = {
  title: 'Contratos - Admin Panel',
  description: 'Gestión de contratos de empleados',
};

export default function ContratosPage() {
  return <ContratosClient />;
}