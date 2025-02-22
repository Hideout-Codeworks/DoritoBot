import { pool } from '../utils/database';
import { client } from '../main';

async function unbanExpiredUsers(): Promise<void> {
    if (!client.user) return;
    try {
        const now = new Date().toISOString().split('.')[0];

        const [expiredBans] = await pool.execute(
            `SELECT guild_id, user_id FROM banned_users WHERE banned_until <= ?`,
            [now]
        ) as any[];

        for (const ban of expiredBans) {
            const guild = client.guilds.cache.get(ban.guild_id);
            if (!guild) continue;

            try {
                await guild.members.unban(ban.user_id, `${client.user.tag}: Ban expired`);
                console.log(`Unbanned ${ban.user_id} in guild ${ban.guild_id}`);

                await pool.execute(
                    `DELETE FROM banned_users WHERE guild_id = ? AND user_id = ?`,
                    [ban.guild_id, ban.user_id]
                );
            } catch (error) {
                console.error(`Failed to unban ${ban.user_id} in guild ${ban.guild_id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error processing unban queue:', error);
    }
}

setInterval(unbanExpiredUsers, 60000);