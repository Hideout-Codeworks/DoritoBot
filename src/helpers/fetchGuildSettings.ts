import {pool} from '../utils/database';
import {RowDataPacket} from "mysql2";

interface GuildSettings {
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

        return rowData[0] as GuildSettings;
    } catch (error) {
        console.error('Error fetching guild settings:', error);
        return null;
    }
}
