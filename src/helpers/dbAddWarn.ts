import { pool } from '../utils/database';

export async function addWarnToDB(guildId: string, modId: string, userId: string, reason: string | null): Promise<boolean> {
    try {
        await pool.execute(
            `INSERT INTO warnings (guild_id, mod_id, user_id, reason) VALUES (?, ?, ?, ?)`,
            [guildId, modId, userId, reason]
        );
        return true;
    } catch (error) {
        console.error('Error inserting warn into database:', error);
        return false;
    }
}

export async function listWarns(guildId: string, userId: string): Promise<{ mod_id: string, reason: string, created_at: string }[]> {
    try {
        const [rows] = await pool.execute(
            `SELECT mod_id, reason, created_at FROM warnings WHERE guild_id = ? AND user_id = ?`,
            [guildId, userId]
        ) as any[];
        return rows;
    } catch (error) {
        console.error('Error fetching warns for user:', error);
        return [];
    }
}
