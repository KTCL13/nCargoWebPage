import { Metadata } from 'next';
import { CotizacionesClient } from '@/components/admin/cotizaciones/CotizacionesClient';

export const metadata: Metadata = {
  title: 'Cotizaciones - Admin Panel',
  description: 'Gestión de cotizaciones, envíos y almacenes',
};

export default function CotizacionesPage() {
  return <CotizacionesClient />;
}