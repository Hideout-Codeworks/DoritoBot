import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder
} from 'discord.js';
import { fetchGuildSettings, GuildSettings } from '../../helpers/fetchGuildSettings';
import { pool } from '../../utils/database';

export const data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Manage Bot Settings for this Server')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('enable')
            .setDescription('Enable a feature')
            .addStringOption(option =>
                option.setName('feature')
                    .setDescription('The feature to enable or disable')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Restrict to CMD Channel', value: 'restrict_cmds' },
                        { name: 'Logging', value: 'logging' },
                        { name: 'Only log bot moderation', value: 'botonly_logging' },
                        { name: 'Moderation Commands', value: 'moderation' },
                        { name: 'Utility Commands', value: 'utility' },
                        { name: 'Fun Commands', value: 'fun' },
                        { name: 'Leveling System', value: 'leveling' },
                    ))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('disable')
            .setDescription('Disable a feature')
            .addStringOption(option =>
                option.setName('feature')
                    .setDescription('The feature to enable or disable')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Restrict to CMD Channel', value: 'restrict_cmds' },
                        { name: 'Logging', value: 'logging' },
                        { name: 'Only log bot moderation', value: 'botonly_logging' },
                        { name: 'Moderation Commands', value: 'moderation' },
                        { name: 'Utility Commands', value: 'utility' },
                        { name: 'Fun Commands', value: 'fun' },
                        { name: 'Leveling System', value: 'leveling' },
                    ))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('list')
            .setDescription('List the current settings')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
        return;
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({
            content: 'You need the **Manage Server** permission to change these settings.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    const settings = await fetchGuildSettings(guildId);
    if (!settings) {
        await interaction.reply({
            content: 'Unable to fetch guild settings.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    if (subcommand === 'enable') {
        try {
            const feature = interaction.options.getString('feature');
            const featureKey =  feature as keyof GuildSettings;
            if (!feature) return;

            if (settings[featureKey] === 1) {
                await interaction.reply({
                    content: `This feature is already enabled!.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const query = `UPDATE guild_settings SET ${feature} = ? WHERE guild_id = ?`;
            await pool.execute(query, [1, guildId]);

            await interaction.reply({
                content: `Successfully enabled feature for this server!`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error handling feature command:', error);
            await interaction.reply({ content: 'There was an error while updating the feature.', flags: MessageFlags.Ephemeral });
        }
    }

    if (subcommand === 'disable') {
        try {
            const feature = interaction.options.getString('feature');
            const featureKey =  feature as keyof GuildSettings;
            if (!feature) return;

            if (settings[featureKey] === 0) {
                await interaction.reply({
                    content: `This feature is already disabled!.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const query = `UPDATE guild_settings SET ${feature} = ? WHERE guild_id = ?`;
            await pool.execute(query, [0, guildId]);

            await interaction.reply({
                content: `Successfully disabled feature for this server!`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error handling feature command:', error);
            await interaction.reply({ content: 'There was an error while updating the feature.', flags: MessageFlags.Ephemeral });
        }
    }

    if (subcommand === 'list') {
        try {
            const embed = new EmbedBuilder()
                .setColor('#e6d47b')
                .setTitle(`⚙️ Settings for **${interaction.guild.name}**`)
                .addFields(
                    { name: '', value: '🧪 **Bot Features**', inline: false },
                    { name: '', value: `-# Restrict to CMD Channel\n${settings.restrict_cmds ? '\`🟢 ENABLED \`' : '\`🔴 DISABLED \`'}`, inline: true },
                    { name: '', value: `-# Logging\n${settings.logging ? '\`🟢 ENABLED \`' : '\`🔴 DISABLED \`'}`, inline: true },
                    { name: '', value: `-# Only log bot moderation\n${settings.botonly_logging ? '\`🟢 ENABLED \`' : '\`🔴 DISABLED \`'}`, inline: true },
                    { name: '', value: `-# Moderation Commands\n${settings.moderation ? '\`🟢 ENABLED \`' : '\`🔴 DISABLED \`'}`, inline: true },
                    { name: '', value: `-# Utility Commands\n${settings.utility ? '\`🟢 ENABLED \`' : '\`🔴 DISABLED \`'}` , inline: true },
                    { name: '', value: `-# Fun Commands\n${settings.fun ? '\`🟢 ENABLED \`' : '\`🔴 DISABLED \`'}`, inline: true },
                    { name: '', value: `-# Leveling System\n${settings.leveling ? '\`🟢 ENABLED \`' : '\`🔴 DISABLED \`'}`, inline: true },
                    { name: '', value: '💬 **Bot Channels**', inline: false },
                    { name: '', value: `-# Moderation Log Channel\n${settings.modlog_channel ? `<#${settings.modlog_channel}>` : '\` NOT SET \`'}`, inline: true },
                    { name: '', value: `-# CMD Channel\n${settings.cmd_channel ? `<#${settings.cmd_channel}>` : '` NOT SET `'}`, inline: true },
                    {
                        name: '',
                        value: `-# No XP Channels\n${
                            settings.no_xp_channels
                                ? (() => {
                                    try {
                                        const channels = JSON.parse(settings.no_xp_channels);
                                        if (Array.isArray(channels) && channels.length > 0) {
                                            return channels.map((id: string) => `<#${id}>`).join(', ');
                                        } else {
                                            return '\` NOT SET \`'; 
                                        }
                                    } catch (error) {
                                        return '\` INVALID \`';
                                    }
                                })()
                                : '\` NOT SET \`'
                        }`,
                        inline: true
                    }
                )
                .setTimestamp()
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error handling feature command:', error);
            await interaction.reply({ content: 'There was an error while listing the features.', flags: MessageFlags.Ephemeral });
        }
    }
}
