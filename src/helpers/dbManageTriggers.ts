import { pool } from '../utils/database';

export async function getSnippetIdByName(guildId: string, snippetName: string): Promise<number | null> {
    try {
        const [rows] = await pool.execute(
            `SELECT id FROM snippets WHERE guild_id = ? AND LOWER(name) = ?`,
            [guildId, snippetName.toLowerCase()]
        ) as any[];

        if (rows.length > 0) {
            return rows[0].id;
        } else {
            return null; // Return null if no snippet is found
        }
    } catch (error) {
        console.error('Error fetching snippet id:', error);
        return null;
    }
}

export async function addTrigger(guildId: string, snippetName: string, trigger: string, channels: string[]): Promise<boolean> {
    try {
        const snippetId = await getSnippetIdByName(guildId, snippetName);

        if (!snippetId) {
            console.error(`Snippet with name "${snippetName}" not found in guild ${guildId}.`);
            return false;
        }

        const triggerLower = trigger.toLowerCase();
        const channelsList = JSON.stringify(channels); // Store channels as a JSON string

        await pool.execute(
            `INSERT INTO snippet_triggers (guild_id, snippet_id, \`trigger\`, channels) VALUES (?, ?, ?, ?)`,
            [guildId, snippetId, triggerLower, channelsList]
        );

        return true;
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.error(`Trigger "${trigger}" already exists for snippet "${snippetName}" in guild ${guildId}.`);
        } else {
            console.error('Error adding trigger:', error);
        }
        return false;
    }
}

export async function editTrigger(
    guildId: string,
    trigger: string,
    newTrigger?: string,
    newChannels?: string
): Promise<boolean> {
    if (!newTrigger && !newChannels) {
        console.log('No changes provided for the trigger edit.');
        return false;
    }

    try {
        const updateFields: string[] = [];
        const values: any[] = [];

        if (newTrigger) {
            updateFields.push('`trigger` = ?');
            values.push(newTrigger);
        }
        if (newChannels) {
            updateFields.push('channels = ?');
            values.push(newChannels);
        }

        values.push(guildId, trigger);

        const [result] = await pool.execute(
            `UPDATE snippet_triggers SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ? AND LOWER(\`trigger\`) = ?`,
            values
        ) as any[];

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error editing trigger:', error);
        return false;
    }
}

export async function deleteTrigger(guildId: string, trigger: string): Promise<boolean> {
    try {
        const lowercasedTrigger = trigger.toLowerCase();
        const [result] = await pool.execute(
            `DELETE FROM snippet_triggers WHERE guild_id = ? AND LOWER(\`trigger\`) = ?`,
            [guildId, lowercasedTrigger]
        ) as any[];

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error deleting trigger:', error);
        return false;
    }
}

export async function getTriggers(guildId: string, snippetId: number): Promise<{ trigger: string, channels: string[] }[]> {
    try {
        const [rows] = await pool.execute(
            `SELECT \`trigger\`, channels FROM snippet_triggers WHERE guild_id = ? AND snippet_id = ?`,
            [guildId, snippetId]
        ) as any[];

        return rows.map((row: any) => ({
            trigger: row.trigger,
            channels: JSON.parse(row.channels)
        }));
    } catch (error) {
        console.error('Error fetching triggers:', error);
        return [];
    }
}

export async function getAllTriggers(guildId: string): Promise<{ trigger: string, channels: string[], snippet_id: number }[]> {
    if (!guildId) {
        console.error('Invalid guildId:', guildId);
        return [];
    }

    try {
        const [rows] = await pool.execute(
            `SELECT \`trigger\`, channels, snippet_id FROM snippet_triggers WHERE guild_id = ?`,
            [guildId]
        ) as any[];

        return rows.map((row: any) => {
            let channelsParsed: string[];
            try {
                channelsParsed = JSON.parse(row.channels);
            } catch (error) {
                console.error(`Error parsing channels for trigger ${row.trigger}:`, error);
                channelsParsed = [];
            }

            return {
                trigger: row.trigger,
                channels: channelsParsed,
                snippet_id: row.snippet_id
            };
        });
    } catch (error) {
        console.error('Error fetching triggers:', error);
        return [];
    }
}

