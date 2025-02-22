import { AuditLogEvent, GuildMember, PartialGuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import { client } from '../index';
import { parseHumanDuration } from '../helpers/parseDuration';
import { fetchGuildSettings } from '../helpers/fetchGuildSettings';

export const name = 'auditLogCreate';

client.on('guildMemberUpdate', async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) =>  {
    try {
        if (oldMember.communicationDisabledUntilTimestamp === newMember.communicationDisabledUntilTimestamp) return;

        if (!client.user) return;

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
        if (!target || !executor || !newMember.communicationDisabledUntilTimestamp) return;

        const timeoutDuration = newMember.communicationDisabledUntilTimestamp - 27000;
        const humanDuration = parseHumanDuration(timeoutDuration - createdTimestamp);

        if (executor.id === client.user.id && reason) {
            const [moderatorUserTag, timeoutReason] = reason.split(': ', 2);
            const embed = new EmbedBuilder()
                .setColor('#ff6666')
                .setDescription(`<:timeout:1342496377741250660> **${moderatorUserTag}** timed out **${target.tag}** for \`${humanDuration}\``)
                .addFields(
                    { name: '', value: `-# **Reason:**\n\`${timeoutReason}\``, inline: false}
                )
                .setFooter({ text: 'Timeout Action'})
                .setTimestamp();
            await modlogChannel.send({ embeds: [embed] });
        } else if(!settings.botonly_logging || executor.id !== client.user.id) {
            const embed = new EmbedBuilder()
                .setColor('#ff6666')
                .setDescription(`<:timeout:1342496377741250660> **${executor.tag}** timed out **${target.tag}** for \`${humanDuration}\``)
                .addFields(
                    { name: '', value: `-# **Reason:**\n\`${reason ?? 'No reason provided'}\``, inline: false}
                )
                .setFooter({ text: 'Timeout Action'})
                .setTimestamp();
            await modlogChannel.send({ embeds: [embed]});
        }
    } catch (error) {
        console.error('Error fetching audit logs:', error);
    }
});

let isBanInProgress = false;

client.on('guildBanAdd', async (ban) => {
    if (isBanInProgress) return;
    try {
        isBanInProgress = true;

        const settings = await fetchGuildSettings(ban.guild.id);
        if (!settings || settings.logging === 0 || !settings.modlog_channel) return;

        if (!client.user) return;

        const modlogChannel = ban.guild.channels.cache.get(settings.modlog_channel) as TextChannel;
        if (!modlogChannel) {
            console.log(`Invalid modlog channel or channel not found in guild: ${ban.guild.id}`);
            return;
        }

        const auditLogs = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanAdd,
        });

        const banLog = auditLogs.entries.first();
        if (!banLog) return;

        const { executor, reason } = banLog;
        if (!executor) return;

        if (executor.id === client.user.id && reason) {
            console.log('Type: Bot Ban');
            const [moderatorUserTag, banDuration, banReason] = reason.split(': ', 3);
                        const embed = new EmbedBuilder()
                            .setColor('#781723')
                            .setDescription(`<:ban:1342495253164327094> **${moderatorUserTag}** banned **${ban.user.tag}**`)
                            .addFields(
                                { name: '', value: `-# **Duration:**\n\`${banDuration}\``, inline: false},
                                { name: '', value: `-# **Reason:**\n\`${banReason}\``, inline: false}
                            )
                            .setFooter({ text: 'Ban Action'})
                            .setTimestamp();
                        await modlogChannel.send({ embeds: [embed] });
                    } else if (!settings.botonly_logging || executor.id !== client.user.id) {
                        console.log('Type: User Ban');
                        const embed = new EmbedBuilder()
                            .setColor('#781723')
                            .setDescription(`<:ban:1342495253164327094> **${executor.tag}** banned **${ban.user.tag}**`)
                            .addFields(
                                { name: '', value: `-# **Duration:**\n\`Permanent\``, inline: false},
                                { name: '', value: `-# **Reason:**\n\`${reason ?? 'No reason provided'}\``, inline: false}
                            )
                            .setFooter({ text: 'Ban Action'})
                            .setTimestamp();
                        await modlogChannel.send({ embeds: [embed] });
                    }
            } catch (error) {
        console.error('Error handling kick/ban event:', error);
    } finally {
        isBanInProgress = false;
    }
});

client.on('guildMemberRemove', async ( member) => {
    if (isBanInProgress) return;
    try {
        if (!client.user) return;

        const settings = await fetchGuildSettings(member.guild.id);
        if (!settings || settings.logging === 0 || !settings.modlog_channel) return;

        const modlogChannel = member.guild.channels.cache.get(settings.modlog_channel) as TextChannel;
        if (!modlogChannel) {
            console.log(`Invalid modlog channel or channel not found in guild: ${member.guild.id}`);
            return;
        }

        const auditLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberKick,
        });

        const kickLog = auditLogs.entries.first();
        if (!kickLog) return;

        const { executor, reason } = kickLog;
        if (!executor) return;

        if (executor.id === client.user.id && reason) {
            console.log('Type: Bot Kick');
            const [moderatorUserTag, kickReason] = reason.split(': ', 2);
            const embed = new EmbedBuilder()
                .setColor('#ffad33')
                .setDescription(`<:kick:1342698439431032833> **${moderatorUserTag}** kicked **${member.user.tag}**`)
                .addFields(
                    { name: '', value: `-# **Reason:**\n\`${kickReason}\``, inline: false}
                )
                .setFooter({ text: 'Kick Action'})
                .setTimestamp();
            await modlogChannel.send({ embeds: [embed] });
        } else if (!settings.botonly_logging && executor.id !== client.user.id) {
            console.log('Type: User Kick');
            const embed = new EmbedBuilder()
                .setColor('#ffad33')
                .setDescription(`<:kick:1342698439431032833> **${executor.tag}** kicked **${member.user.tag}**`)
                .addFields(
                    {name: '', value: `-# **Reason:**\n\`${reason ?? 'No reason provided'}\``, inline: false}
                )
                .setFooter({text: 'Kick Action'})
                .setTimestamp();
            await modlogChannel.send({embeds: [embed]});
        }
    } catch (error) {
        console.error('Error handling kick event:', error);
    }
});

client.on("guildBanRemove", async ( ban ) => {
    if (isBanInProgress) return;
    try {
        isBanInProgress = true;
        const settings = await fetchGuildSettings(ban.guild.id);
        if (!settings || settings.logging === 0 || !settings.modlog_channel) return;

        if (!client.user) return;

        const modlogChannel = ban.guild.channels.cache.get(settings.modlog_channel) as TextChannel;
        if (!modlogChannel) {
            console.log(`Invalid modlog channel or channel not found in guild: ${ban.guild.id}`);
            return;
        }

        const auditLogs = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanRemove,
        });

        const unbanLog = auditLogs.entries.first();
        if (!unbanLog) return;

        const { executor, reason } = unbanLog;
        if (!executor) return;

        const embed = new EmbedBuilder()
            .setColor('#63e6be')
            .setDescription(`<:unban:1342697402250821662> **${executor.tag}** unbanned **${ban.user.tag}**`)
            .addFields(
                { name: '', value: `-# **Reason:**\n\`${reason ?? 'No reason provided'}\``, inline: false}
            )
            .setFooter({ text: 'Unban Action'})
            .setTimestamp();
        await modlogChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error handling unban event:', error);
    } finally {
        isBanInProgress = false;
    }
});