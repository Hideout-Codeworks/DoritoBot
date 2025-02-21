import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ChannelType,
    MessageFlags,
    PermissionFlagsBits
} from 'discord.js';
import { pool } from '../../utils/database';

export const data = new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Set specific channels for the bot to use (e.g., modlog_channel, gacha_channel, cmd_channel).')
    .addStringOption(option =>
        option.setName('channel_type')
            .setDescription('Type of channel to set')
            .setRequired(true)
            .addChoices(
                { name: 'modlog_channel', value: 'modlog_channel' },
                { name: 'gacha_channel', value: 'gacha_channel' },
                { name: 'cmd_channel', value: 'cmd_channel' },
            ))
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Channel to set for the selected type')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const channelType = interaction.options.getString('channel_type')!;
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guildId;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({
            content: 'You need the **Manage Server** permission to change these settings.',
            ephemeral: true,
        });
        return;
    }

    if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({
            content: 'Please provide a valid text channel.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    try {
        // Update the database with the new channel for the selected type
        const query = `UPDATE guild_settings SET ${channelType} = ? WHERE guild_id = ?`;
        await pool.execute(query, [channel.id, guildId]);

        await interaction.reply({
            content: `Successfully set the ${channelType} to <#${channel.id}>.`,
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        console.error('Error updating channel settings:', error);
        await interaction.reply({
            content: 'There was an error setting the channel. Please try again later.',
            flags: MessageFlags.Ephemeral
        });
    }
}
