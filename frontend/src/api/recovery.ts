// src/api/recovery.ts
import axios from '../api/client'

export interface RecoveryRequest {
  user_id: string
  date: string
}

export interface RecoveryResponse {
  predicted_recovery_rating: number
}


export async function getRecovery(req: RecoveryRequest): Promise<RecoveryResponse | null> {
    try {
      const { data } = await axios.post<RecoveryResponse>('/recovery/predict', req)
      return data
    } catch (err: any) {
      // If the server still returns 422 (not enough inputs), just treat it as “no score yet”
      if (err.response?.status === 422) return null
      throw err
    }
  }