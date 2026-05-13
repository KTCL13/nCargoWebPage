import { Metadata } from 'next';
import { EnviosClient } from '@/components/admin/envios/EnviosClient';

export const metadata: Metadata = {
  title: 'Gestión de Envíos - Admin Panel',
  description: 'Gestión y sincronización de envíos y casilleros',
};

export default function EnviosPage() {
  return <EnviosClient />;
}
