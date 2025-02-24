import { pool } from '../utils/database';

export async function addBanToDB(guildId: string, userId: string, bannedUntil: string | null): Promise<void> {
    try {
        await pool.execute(
            `INSERT INTO banned_users (guild_id, user_id, banned_until) VALUES (?, ?, ?)`,
            [guildId, userId, bannedUntil]
        );
    } catch (error) {
        console.error('Error inserting ban into database:', error);
    }
}