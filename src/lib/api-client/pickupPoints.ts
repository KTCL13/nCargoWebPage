import { Office } from '@/types/admin/quotations';
import { authFetch } from './auth-fetch';

export const pickupPointsClient = {
  async saveOffice(token: string | null, form: any, editingOfficeId?: number) {
    const url = editingOfficeId ? `/api/pickup-points?id=${editingOfficeId}` : '/api/pickup-points';
    const method = editingOfficeId ? 'PATCH' : 'POST';
    
    const res = await authFetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        coverageRadiusMiles: form.coverageRadiusMiles ? parseFloat(form.coverageRadiusMiles) : null
      })
    });
    
    if (!res.ok) {
      throw new Error('Error saving office');
    }
    return res.json();
  },

  async toggleActive(token: string | null, id: number, currentStatus: boolean) {
    const res = await authFetch(`/api/pickup-points?id=${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ isActive: !currentStatus })
    });
    
    if (!res.ok) {
      throw new Error('Error toggling office status');
    }
    return res.json();
  },

  async deleteOffice(token: string | null, id: number) {
    const res = await authFetch(`/api/pickup-points?id=${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    
    if (!res.ok) {
      throw new Error('Error deleting office');
    }
    return res.json();
  }
};
