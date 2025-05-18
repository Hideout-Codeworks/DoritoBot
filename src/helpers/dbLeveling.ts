import {pool} from '../utils/database';
import {GuildSettings} from "./fetchGuildSettings";
import {RowDataPacket} from 'mysql2';
import {MessageFlags} from "discord.js";

export interface LevelRewards {
    [level: number]: string[];
}

const userCooldowns: Map<string, number> = new Map();
const COOLDOWN_TIME = 30000;

async function canReceiveXP(userId: string): Promise<boolean> {
    const lastXPTime = userCooldowns.get(userId);

    if (!lastXPTime) {
        return true;
    }

    const currentTime = Date.now();
    return currentTime - lastXPTime >= COOLDOWN_TIME;
}

export async function addXP(guildId: string, userId: string, xp: number): Promise<void> {
    const LEVEL_UP_BASE = 100;
    const LEVEL_MULTIPLIER = 1.2;
    try {
        if (!(await canReceiveXP(userId))) {
            console.log(`User ${userId} is on cooldown and cannot receive XP yet.`);
            return;
        }

        await pool.execute(
            `INSERT INTO levels (guild_id, user_id, xp) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE xp = xp + VALUES(xp)`,
            [guildId, userId, xp]
        );

        const [lvlRow] = await pool.execute(
            `SELECT level FROM levels WHERE guild_id = ? AND user_id = ?`,
            [guildId, userId]
        )

        const level = lvlRow && (lvlRow as any).length > 0 ? Number((lvlRow as any)[0].level): 0;
        let newXP = await getXP(guildId, userId);

        const nextLevelXP = Math.floor(LEVEL_UP_BASE * Math.pow(LEVEL_MULTIPLIER, level));
        if (newXP > nextLevelXP) {
            const newLevel = level + 1;
            await pool.execute(
                `UPDATE levels SET level = ? WHERE guild_id = ? AND user_id = ?`,
                [newLevel, guildId, userId]
            );
        }
        userCooldowns.set(userId, Date.now());

    } catch (error) {
        console.error('Error updating leveling database:', error);
    }
}

export async function getXP(guildId: string, userId: string): Promise<number | 0> {
    try {
        const [rows] = await pool.execute(
            `SELECT xp FROM levels WHERE guild_id = ? AND user_id = ?`,
            [guildId, userId]);

        return rows && (rows as any).length > 0 ? Number((rows as any)[0].xp) : 0;
    } catch (error) {
        console.error('Error fetching XP from database:', error);
    }
    return 0;
}

export async function getNextLevelXP(guildId: string, userId: string): Promise<number> {
    const LEVEL_UP_BASE = 100;
    const LEVEL_MULTIPLIER = 1.2;
    const [lvlRow] = await pool.execute(
        `SELECT level FROM levels WHERE guild_id = ? AND user_id = ?`,
        [guildId, userId]
    )
    const level = lvlRow && (lvlRow as any).length > 0 ? Number((lvlRow as any)[0].level): 0;
    return Math.floor(LEVEL_UP_BASE * Math.pow(LEVEL_MULTIPLIER, level));
}

export async function getLevel(guildId: string, userId: string): Promise<number | 0> {
    try {
        const [rows] = await pool.execute(
            `SELECT level FROM levels WHERE guild_id = ? AND user_id = ?`,
            [guildId, userId]);
        return rows && (rows as any).length > 0 ? Number((rows as any)[0].level) : 0;
    } catch (error) {
        console.error('Error fetching level from database:', error);
    }
    return 0;
}

export async function getRank(guildId: string, userId: string): Promise<number | null> {
    try {
        const [xpRow] = await pool.execute(
            `SELECT xp FROM levels WHERE guild_id = ? AND user_id = ?`,
            [guildId, userId]
        );

        const userXP = Number((xpRow as RowDataPacket[])[0]?.xp);
        if (isNaN(userXP)) {
            console.error('User XP not found or invalid');
            return null;
        }

        const [allUsers] = await pool.execute(
            `SELECT user_id, xp FROM levels WHERE guild_id = ? ORDER BY xp DESC`,
            [guildId]
        );

        const rank = (allUsers as RowDataPacket[]).findIndex((user) => Number(user.xp) === userXP) + 1;

        return rank > 0 ? rank : null;

    } catch (error) {
        console.error('Error fetching rank:', error);
        return null;
    }
}

export async function getTopRanks(guildId: string, topN: number): Promise<{ userId: string, xp: number, lvl: number }[]> {
    try {
        const [topUsers] = await pool.execute(
            `SELECT user_id, xp, level FROM levels WHERE guild_id = ? ORDER BY xp DESC LIMIT ?`,
            [guildId, topN]
        );

        return (topUsers as RowDataPacket[]).map(user => ({
            userId: user.user_id,
            lvl: Number(user.level),
            xp: Number(user.xp)
        }));

    } catch (error) {
        console.error('Error fetching top ranks:', error);
        return [];
    }
}


export async function getLevelSettings(guildId: string): Promise<GuildSettings | null> {
    try {
        const [rows] = await pool.execute(
            `SELECT no_xp_channels, level_rewards, level_notifs FROM guild_settings WHERE guild_id = ?`,
            [guildId]
        );

        const settings = (rows as GuildSettings[])[0] || null;

        if (settings) {
            if (settings.no_xp_channels) {
                try {
                    settings.no_xp_channels = JSON.parse(settings.no_xp_channels);
                    if (!Array.isArray(settings.no_xp_channels)) {
                        settings.no_xp_channels = "";
                    }
                } catch (error) {
                    console.error('Error parsing no_xp_channels:', error);
                    settings.no_xp_channels = "";
                }
            } else if (settings.no_xp_channels === null) {
                settings.no_xp_channels = "";
            }
        }

        console.log(settings?.level_notifs);

        return settings;
    } catch (error) {
        console.error('Error fetching leveling settings:', error);
        return null;
    }
}


export async function updateNoXpChannels(guildId: string, channelId: string, action: 'add' | 'remove'): Promise<boolean> {
    const settings = await getLevelSettings(guildId);
    if (!settings) return false;

    let channels: string[] = Array.isArray(settings.no_xp_channels) ? settings.no_xp_channels : [];

    if (action === 'add' && !channels.includes(channelId)) {
        channels.push(channelId);
    } else if (action === 'remove') {
        channels = channels.filter(id => id !== channelId);
    }

    try {
        await pool.execute(
            `UPDATE guild_settings SET no_xp_channels = ? WHERE guild_id = ?`,
            [JSON.stringify(channels), guildId]
        );
        return true;
    } catch (error) {
        console.error('Error updating no XP channels:', error);
        return false;
    }
}

export async function addLevelReward(guildId: string, level: number, roleId: string): Promise<boolean> {
    const settings = await getLevelSettings(guildId);
    if (!settings) return false;

    let rewards: LevelRewards = {};

    if (settings.level_rewards) {
        try {
            rewards = JSON.parse(settings.level_rewards);
            if (typeof rewards !== 'object') {
                rewards = {};
            }
        } catch (error) {
            console.error('Error parsing level_rewards:', error);
            rewards = {};
        }
    }

    if (!rewards[level]) rewards[level] = [];
    if (!rewards[level].includes(roleId)) rewards[level].push(roleId);

    try {
        await pool.execute(
            `UPDATE guild_settings SET level_rewards = ? WHERE guild_id = ?`,
            [JSON.stringify(rewards), guildId]
        );
        return true;
    } catch (error) {
        console.error('Error updating level rewards:', error);
        return false;
    }
}

export async function removeLevelReward(guildId: string, roleId: string): Promise<boolean> {
    const settings = await getLevelSettings(guildId);
    if (!settings) return false;

    let rewards: LevelRewards = {};

    if (settings.level_rewards) {
        try {
            rewards = JSON.parse(settings.level_rewards);
            if (typeof rewards !== 'object') {
                rewards = {};
            }
        } catch (error) {
            console.error('Error parsing level_rewards:', error);
            rewards = {};
        }
    }

    let roleRemoved = false;
    for (const level in rewards) {
        const index = rewards[level].indexOf(roleId);
        if (index !== -1) {
            rewards[level].splice(index, 1);

            if (rewards[level].length === 0) {
                delete rewards[level];
            }

            roleRemoved = true;
            break;
        }
    }

    if (roleRemoved) {
        try {
            await pool.execute(
                `UPDATE guild_settings SET level_rewards = ? WHERE guild_id = ?`,
                [JSON.stringify(rewards), guildId]
            );
            return true;
        } catch (error) {
            console.error('Error updating level rewards:', error);
            return false;
        }
    }
    return false;
}

export async function enableNotifs(guildId: string): Promise<boolean> {
    const settings = await getLevelSettings(guildId);
    if (!settings) return false;
    const notifs= settings?.level_notifs;
    if (notifs === 1) return false;
    else {
        try {
            await pool.execute(
                `UPDATE guild_settings SET level_notifs = 1 WHERE guild_id = ?`,
                [guildId]
            );
            return true;
        } catch (error) {
            console.error('Error updating level notifs:', error);
            return false;
        }
    }
}

export async function disableNotifs(guildId: string): Promise<boolean> {
    const settings = await getLevelSettings(guildId);
    if (!settings) return false;
    const notifs= settings?.level_notifs;
    if (notifs === 0) return false;
    else {
        try {
            await pool.execute(
                `UPDATE guild_settings SET level_notifs = 0 WHERE guild_id = ?`,
                [guildId]
            );
            return true;
        } catch (error) {
            console.error('Error updating level notifs:', error);
            return false;
        }
    }
}