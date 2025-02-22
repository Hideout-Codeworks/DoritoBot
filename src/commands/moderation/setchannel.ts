import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ChannelType,
    MessageFlags,
    PermissionFlagsBits
} from 'discord.js';
import { pool } from '../../utils/database';

const CHANNEL_TYPE_NAMES: Record<string, string> = {
    modlog_channel: 'modlog channel',
    gacha_channel: 'gacha channel',
    cmd_channel: 'commands channel'
};


export const data = new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Set specific channels for the bot to use (e.g., modlog_channel, gacha_channel, cmd_channel).')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Type of channel to set')
            .setRequired(true)
            .addChoices(
                { name: 'Modlog Channel', value: 'modlog_channel' },
                { name: 'Gacha Channel', value: 'gacha_channel' },
                { name: 'Commands Channel', value: 'cmd_channel' },
            ))
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Channel to set for the selected type')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const channelType = interaction.options.getString('type')!;
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
        const query = `UPDATE guild_settings SET ${channelType} = ? WHERE guild_id = ?`;
        await pool.execute(query, [channel.id, guildId]);

        const readableChannelType = CHANNEL_TYPE_NAMES[channelType] || 'Unknown Channel Type';

        await interaction.reply({
            content: `Successfully set <#${channel.id}> as ${readableChannelType}.`,
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
