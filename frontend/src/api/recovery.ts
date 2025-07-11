// src/api/recovery.ts
import axios from '../api/client'

export interface RecoveryRequest {
  user_id: string
  date: string
}

export interface RecoveryResponse {
  predicted_recovery_rating: number
}

export async function getRecovery(req: RecoveryRequest) {
    if (!req.user_id) {
      console.warn('[getRecovery] Missing user_id – skipping request');
      return null;
    }
  
    console.log('[getRecovery] Final payload:', req)
  
    try {
      const { data } = await axios.post('/recovery/predict?debug=true', req);
      return data;
    } catch (err: any) {
      if (err.response?.status === 422) {
        console.warn('[getRecovery] 422 error:', err.response.data);
        return null;
      }
      throw err;
    }
  }  