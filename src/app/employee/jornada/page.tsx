import { Metadata } from 'next';
import { JornadaClient } from '@/components/employee/jornada/JornadaClient';

export const metadata: Metadata = {
  title: 'Jornada Laboral - Employee Portal',
  description: 'Gestión de la jornada laboral',
};

export default function JornadaPage() {
  return <JornadaClient />;
}
