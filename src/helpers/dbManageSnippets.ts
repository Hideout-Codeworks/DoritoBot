import { pool } from '../utils/database';

export async function getSnippetByID(guildId: string, snippetId: number): Promise<{ name: string, content: string, author_id: string } | null> {
    if (!guildId || snippetId === undefined) {
        console.error('Invalid guildId or snippetId:', { guildId, snippetId });
        return null;
    }
    try {
        const [rows] = await pool.execute(
            `SELECT name, content, author_id FROM snippets WHERE guild_id = ? AND id = ?`,
            [guildId, snippetId]
        ) as any[];

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error fetching snippet by ID:', error);
        return null;
    }
}

export async function addSnippet(guildId: string, authorId: string, name: string, content: string): Promise<boolean> {
    try {
        const lowerName = name.toLowerCase();
        await pool.execute(
            `INSERT INTO snippets (guild_id, author_id, name, content) VALUES (?, ?, ?, ?)`,
            [guildId, authorId, lowerName, content]
        );
        return true;
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.error(`Snippet "${name}" already exists in guild ${guildId}.`);
        } else {
            console.error('Error adding snippet:', error);
        }
        return false;
    }
}

export async function editSnippet(guildId: string, name: string, newName?: string, newContent?: string): Promise<boolean> {
    if (!newName && !newContent) return false;

    try {
        const updateFields = [];
        const values: any[] = [];

        if (newName) {
            const newNameLower = newName.toLowerCase();
            updateFields.push('name = ?');
            values.push(newNameLower);
        }
        if (newContent) {
            updateFields.push('content = ?');
            values.push(newContent);
        }

        values.push(guildId, name);

        const [result] = await pool.execute(
            `UPDATE snippets SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ? AND LOWER(name) = ?`,
            values
        ) as any[];

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error editing snippet:', error);
        return false;
    }
}

export async function deleteSnippet(guildId: string, name: string): Promise<boolean> {
    try {
        const lowercasedName = name.toLowerCase();
        const [result] = await pool.execute(
            `DELETE FROM snippets WHERE guild_id = ? AND LOWER(name) = ?`,
            [guildId, lowercasedName]
        ) as any[];

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error deleting snippet:', error);
        return false;
    }
}

export async function getSnippet(guildId: string, name: string): Promise<{ name: string, content: string, author_id: string } | null> {
    try {
        const lowercasedName = name.toLowerCase();
        const [rows] = await pool.execute(
            `SELECT name, content, author_id FROM snippets WHERE guild_id = ? AND LOWER(name) = ?`,
            [guildId, lowercasedName]
        ) as any[];

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error fetching snippet:', error);
        return null;
    }
}

export async function getAllSnippets(guildId: string): Promise<{ name: string, content: string, author_id: string, updated_at: string }[]> {
    try {
        const [rows] = await pool.execute(
            `SELECT name, content, author_id, updated_at FROM snippets WHERE guild_id = ? ORDER BY name ASC`,
            [guildId]
        ) as any[];

        return rows;
    } catch (error) {
        console.error('Error fetching all snippets:', error);
        return [];
    }
}