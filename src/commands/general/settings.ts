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
                        { name: 'Restrict bot commands to cmd channel', value: 'restrict_cmds' },
                        { name: 'Logging', value: 'logging' },
                        { name: 'Only log moderation actions made through the bot', value: 'botonly_logging' },
                        { name: 'Moderation Commands', value: 'moderation' },
                        { name: 'Utility Commands', value: 'utility' },
                        { name: 'Fun Commands', value: 'fun' },
                        { name: 'Gacha System', value: 'gacha' },
                        { name: 'Restrict commands to CMD Channel', value: 'restrict_cmds' }
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
                        { name: 'Restrict bot commands to cmd channel', value: 'restrict_cmds' },
                        { name: 'Logging', value: 'logging' },
                        { name: 'Only log moderation actions made through the bot', value: 'botonly_logging' },
                        { name: 'Moderation Commands', value: 'moderation' },
                        { name: 'Utility Commands', value: 'utility' },
                        { name: 'Fun Commands', value: 'fun' },
                        { name: 'Gacha System', value: 'gacha' },
                        { name: 'Restrict commands to CMD Channel', value: 'restrict_cmds' }
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
                    { name: 'Restrict bot commands to cmd channel', value: settings.restrict_cmds ? 'Enabled' : 'Disabled', inline: true },
                    { name: 'Logging', value: settings.logging ? 'Enabled' : 'Disabled', inline: true },
                    { name: 'Only log moderation actions made through the bot', value: settings.botonly_logging ? 'Enabled' : 'Disabled', inline: true },
                    { name: 'Moderation Commands', value: settings.moderation ? 'Enabled' : 'Disabled', inline: true },
                    { name: 'Moderation Log Channel', value: settings.modlog_channel ? `<#${settings.modlog_channel}>` : 'Not Set', inline: true },
                    { name: 'Utility Commands', value: settings.utility ? 'Enabled' : 'Disabled', inline: true },
                    { name: 'Fun Commands', value: settings.fun ? 'Enabled' : 'Disabled', inline: true },
                    { name: 'Gacha System', value: settings.gacha ? 'Enabled' : 'Disabled', inline: true },
                    { name: 'Gacha Channel', value: settings.gacha_channel ? `<#${settings.gacha_channel}>` : 'Not Set', inline: true },
                    { name: 'Restrict commands to CMD Channel', value: settings.restrict_cmds ? 'Enabled' : 'Disabled', inline: true },
                    { name: 'CMD Channel', value: settings.cmd_channel ? `<#${settings.cmd_channel}>` : 'Not Set', inline: true }
                )
                .setTimestamp()
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error handling feature command:', error);
            await interaction.reply({ content: 'There was an error while listing the features.', flags: MessageFlags.Ephemeral });
        }
    }
}
