import {pool} from '../utils/database';

export async function fetchGuildSettings(guildId: string) {
    try {
        const query = 'SELECT * FROM guild_settings WHERE guild_id = ?';
        const [rows] = await pool.execute(query, [guildId]);

        if ((rows as Array<any>).length === 0) {
            console.log(`No settings found for guild: ${guildId}, using default settings`);
            return {
                guild_id: guildId,
                logging: 0,
                moderation: 1,
                utility: 1,
                fun: 1,
                gacha: 0,
                botonly_logging: 1,
                modlog_channel: null,
                gacha_channel: null,
                cmd_channel: null,
                restrict_cmds: false,
            };
        }

        return rows;
    } catch (error) {
        console.error('Error fetching guild settings:', error);
        return null;
    }
}
