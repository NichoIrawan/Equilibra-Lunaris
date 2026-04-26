import { apiFetch } from './apiClient';

export interface Kudo {
    id: string;
    message: string;
    is_anonymous: boolean;
    created_at: string;
    receiver_id: string;
    receiver_name: string | null;
    receiver_username: string | null;
    sender_id: string | null;
    sender_name: string | null;
    sender_username: string | null;
}

export class KudosService {
    static async getKudos(limit: number = 50, receiverId?: string): Promise<Kudo[]> {
        const queryParams = new URLSearchParams({ limit: limit.toString() });
        if (receiverId) {
            queryParams.append('receiver_id', receiverId);
        }
        return await apiFetch<Kudo[]>(`/kudos?${queryParams.toString()}`);
    }

    static async createKudo(receiverId: string, message: string, isAnonymous: boolean): Promise<any> {
        return await apiFetch(`/kudos`, {
            method: 'POST',
            body: JSON.stringify({
                receiver_id: receiverId,
                message,
                is_anonymous: isAnonymous
            })
        });
    }
}
