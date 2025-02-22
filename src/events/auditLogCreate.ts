import {AuditLogEvent, GuildAuditLogsEntry, GuildMember, PartialGuildMember, TextChannel, User} from 'discord.js';
import { client } from '../index';
import { parseHumanDuration } from '../helpers/parseDuration';
import { fetchGuildSettings } from '../helpers/fetchGuildSettings';

export const name = 'auditLogCreate';
client.on('guildMemberUpdate', async (newMember: GuildMember | PartialGuildMember) =>  {
    try {
        if (!newMember.communicationDisabledUntilTimestamp) return;

        const settings = await fetchGuildSettings(newMember.guild.id);
        if (!settings || settings.logging === 0 || !settings.modlog_channel) return;

        const modlogChannel = newMember.guild.channels.cache.get(settings.modlog_channel) as TextChannel;

        if (!modlogChannel) {
            console.log(`Invalid modlog channel or channel not found in guild: ${newMember.guild.id}`);
            return;
        }

        const auditLogs = await newMember.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberUpdate,
        });

        const timeoutLog = auditLogs.entries.first();
        if (!timeoutLog) return;

        const { target, executor, reason, createdTimestamp } = timeoutLog;
        if (!target || !executor || !reason) return;

        const timeoutDuration = newMember.communicationDisabledUntilTimestamp - 27000;
        const humanDuration = parseHumanDuration(timeoutDuration - createdTimestamp);

        if (!settings.botonly_logging || executor.id !== client.user?.id) {
            await modlogChannel.send({
                content: `<:timeout:1342496377741250660> **${executor.tag}** timed out **${target.tag}** for \`${humanDuration}\`\nReason: \`${reason}\``,
            });
        } else if (executor.id === client.user?.id) {
            const [moderatorUserTag, timeoutReason] = reason.split(': ', 2);
            await modlogChannel.send({
                content: `<:timeout:1342496377741250660> **${moderatorUserTag}** timed out **${target.tag}** for \`${humanDuration}\`\nReason: \`${timeoutReason}\``,
            });
        }
    } catch (error) {
        console.error('Error fetching audit logs:', error);
    }
});

client.on('guildAuditLogEntryCreate', async (entry: GuildAuditLogsEntry, guild) => {
    try {
        if (!guild) return;

        const settings = await fetchGuildSettings(guild.id);
        if (!settings || settings.logging === 0 || !settings.modlog_channel) return;

        const modlogChannel = guild.channels.cache.get(settings.modlog_channel) as TextChannel;
        if (!modlogChannel) {
            console.log(`Invalid modlog channel or channel not found in guild: ${guild.id}`);
            return;
        }

        const { action, target, executor, reason } = entry;
        if (!target || !executor || !reason) return;

        if (target instanceof User) {
            switch (action) {
                case AuditLogEvent.MemberKick:
                    if (!settings.botonly_logging || executor.id !== client.user?.id) {
                        await modlogChannel.send({
                            content: `<:kick:1342496635631960094> **${executor.tag}** kicked **${target.tag}**\nReason: \`${reason}\``,
                        });
                    } else if (executor.id === client.user?.id) {
                        const [moderatorUserTag, kickReason] = reason.split(': ', 2);
                        await modlogChannel.send({
                            content: `<:kick:1342496635631960094> **${moderatorUserTag}** kicked **${target.tag}**\nReason: \`${kickReason}\``,
                        });
                    }
                    break;

                case AuditLogEvent.MemberBanAdd:
                    if (!settings.botonly_logging || executor.id !== client.user?.id) {
                        await modlogChannel.send({
                            content: `<:ban:1342495253164327094> **${executor.tag}** banned **${target.tag}**\nDuration: \`Permanent\`\nReason: \`${reason ?? 'No reason provided'}\``,
                        });
                    } else if (executor.id === client.user?.id) {
                        const [moderatorUserTag, banDuration, banReason] = reason.split(': ', 3);
                        await modlogChannel.send({
                            content: `<:ban:1342495253164327094> **${moderatorUserTag}** banned **${target.tag}**\nDuration: \`${banDuration}\`\nReason: \`${banReason}\``,
                        });
                    }
                    break;
            }
        }
    } catch (error) {
        console.error('Error handling kick/ban event:', error);
    }
});