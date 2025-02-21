import {AuditLogEvent, GuildMember} from 'discord.js';
import { client } from '../index';
import { parseHumanDuration } from '../helpers/parseDuration';

export const name = 'guildMemberUpdate';
export async function execute(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    try {
        if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil) {
            const auditLogs = await newMember.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberUpdate,
            });

            const timeoutLog = auditLogs.entries.first();
            if (!timeoutLog) return;

            const { target, executor, reason } = timeoutLog;
            const botUser = client.user
            if (!target || !executor || !reason || !botUser || !newMember.communicationDisabledUntil) return;
            const humanDuration = parseHumanDuration(newMember.communicationDisabledUntil.getTime() - new Date().getTime());

            if (executor.id === botUser.id) {
                const [moderatorUserTag, timeoutReason] = reason.split(':', 2);


                await newMember.guild.systemChannel?.send({
                    content: `<:timeout:1342496377741250660> **${moderatorUserTag}** timed out **${target.tag}** for \`${humanDuration}\`.\nReason: \`${timeoutReason}\``,
                });
            } else {
                await newMember.guild.systemChannel?.send({
                    content: `<:timeout:1342496377741250660> **${executor.tag}** timed out **${target.tag}** for \`${humanDuration}\`.\nReason: \`${reason}\``,
                })
            }
        }
    } catch (error) {
        console.error('Error fetching audit logs:', error);
    }
}
