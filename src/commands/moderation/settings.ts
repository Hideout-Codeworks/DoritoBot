import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { fetchGuildSettings, GuildSettings } from '../../helpers/fetchGuildSettings';
import { pool } from '../../utils/database';

const featureNames: Record<string, string> = {
    restrict_cmds: 'Restrict bot commands to cmd channel',
    logging: 'Logging',
    botonly_logging: 'Only log moderation actions made through the bot',
    moderation: 'Moderation Commands',
    utility: 'Utility Commands',
    fun: 'Fun Commands',
    gacha: 'Gacha System'
};

export const data = new SlashCommandBuilder()
    .setName('setting')
    .setDescription('Enable or disable a feature')
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
                { name: 'Gacha System', value: 'gacha' }
            ))
    .addStringOption(option =>
        option.setName('action')
            .setDescription('Enable or disable the feature')
            .setRequired(true)
            .addChoices(
                { name: 'Enable', value: 'enable' },
                { name: 'Disable', value: 'disable' }
            ))
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

    const action = interaction.options.getString('action')!;
    const feature = interaction.options.getString('feature')!;
    const guildId = interaction.guild.id;

    const newValue = action === 'enable' ? 1 : 0;

    try {
        const settings = await fetchGuildSettings(guildId);
        if (!settings) {
            await interaction.reply({
                content: 'Unable to fetch guild settings.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const featureKey = feature as keyof GuildSettings;

        if (settings[featureKey] === newValue) {
            await interaction.reply({
                content: `The feature **${featureNames[feature]}** is already set to **${action}d**.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const query = `UPDATE guild_settings SET ${feature} = ? WHERE guild_id = ?`;
        await pool.execute(query, [newValue, guildId]);

        await interaction.reply({
            content: `Successfully set \`${featureNames[feature]}\` as **${action}d** for this server!`,
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        console.error('Error handling feature command:', error);
        await interaction.reply({ content: 'There was an error while updating the feature.', flags: MessageFlags.Ephemeral });
    }
}
