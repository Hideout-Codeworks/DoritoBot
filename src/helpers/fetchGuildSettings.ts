import {pool} from '../utils/database';
import {RowDataPacket} from "mysql2";

export interface GuildSettings {
    guild_id: string;
    logging: number;
    moderation: number;
    utility: number;
    fun: number;
    gacha: number;
    botonly_logging: number;
    modlog_channel: string | null;
    gacha_channel: string | null;
    cmd_channel: string | null;
    restrict_cmds: number;
}

export async function fetchGuildSettings(guildId: string) {
    try {
        const query = 'SELECT * FROM guild_settings WHERE guild_id = ?';
        const [rows] = await pool.execute(query, [guildId]);
        const rowData = rows as RowDataPacket[];

        if (rowData.length === 0) {
            console.log(`No settings found for guild: ${guildId}, creating new entry with default values`);

            const insertQuery = `
                INSERT INTO guild_settings (guild_id, logging, moderation, utility, fun, gacha, botonly_logging, modlog_channel, gacha_channel, cmd_channel, restrict_cmds)
                VALUES (?, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, null, null, null, DEFAULT);
            `;

            await pool.execute(insertQuery, [guildId]);

            const [newRows] = await pool.execute(query, [guildId]);

            return (newRows as RowDataPacket[])[0] as GuildSettings;
        }

        return rowData[0] as GuildSettings;
    } catch (error) {
        console.error('Error fetching guild settings:', error);
        return null;
    }
}
