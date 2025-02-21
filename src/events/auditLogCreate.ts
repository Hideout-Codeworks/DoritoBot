import {AuditLogEvent, GuildMember, TextChannel} from 'discord.js';
import { client } from '../index';
import { parseHumanDuration } from '../helpers/parseDuration';
import { fetchGuildSettings } from '../helpers/fetchGuildSettings';

export const name = 'guildMemberUpdate';
export async function execute(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    try {
        const settings = await fetchGuildSettings(newMember.guild.id);
        if (!settings || settings.logging === 0 || !settings.modlog_channel) return;

        if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil) {
            const auditLogs = await newMember.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberUpdate,
            });

            const timeoutLog = auditLogs.entries.first();
            if (!timeoutLog) return;

            const modlogChannel = newMember.guild.channels.cache.get(settings.modlog_channel) as TextChannel;
            if (!modlogChannel) {
                console.log(`Invalid modlog channel or channel not found in guild: ${newMember.guild.id}`);
                return;
            }

            const { target, executor, reason } = timeoutLog;
            const botUser = client.user
            if (!target || !executor || !reason || !botUser || !newMember.communicationDisabledUntil) return;
            const humanDuration = parseHumanDuration(newMember.communicationDisabledUntil.getTime() - new Date().getTime());

            if (executor.id === botUser.id) {
                const [moderatorUserTag, timeoutReason] = reason.split(':', 2);
                await modlogChannel.send({
                        content: `<:timeout:1342496377741250660> **${moderatorUserTag}** timed out **${target.tag}** for \`${humanDuration}\`.\nReason: \`${timeoutReason}\``,
                    });
            } else {
                await modlogChannel.send({
                    content: `<:timeout:1342496377741250660> **${executor.tag}** timed out **${target.tag}** for \`${humanDuration}\`.\nReason: \`${reason}\``,
                })
            }
        }
    } catch (error) {
        console.error('Error fetching audit logs:', error);
    }
}
