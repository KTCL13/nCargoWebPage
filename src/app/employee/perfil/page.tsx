import { Metadata } from 'next';
import { PerfilClient } from '@/components/employee/perfil/PerfilClient';

export const metadata: Metadata = {
  title: 'Mi Perfil - Employee Portal',
  description: 'Gestionar información del perfil de empleado',
};

export default function ProfilePage() {
  return <PerfilClient />;
}
