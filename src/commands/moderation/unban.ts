import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    MessageFlags,
} from 'discord.js';
import {pool} from "../../utils/database";
import {checkSettings} from "../../utils/checkSettings";

export const data = new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to unban')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the unban')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    if (!(await checkSettings(interaction, "moderation"))) return;

    const user = interaction.options.getUser('target', true);
    const reason = `${interaction.user.tag}: ${interaction.options.getString('reason') || 'No reason provided'}`;

    try {
        const bans = await interaction.guild.bans.fetch();
        if (!bans.has(user.id)) {
            await interaction.reply({ content: `User <@${user.id}> is not banned.`, flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.guild.bans.remove(user.id, reason);
        await interaction.reply({ content: `<:unban:1342697402250821662> Unbanned user <@${user.id}>.`, flags: MessageFlags.Ephemeral });

        await pool.execute(
            `DELETE FROM banned_users WHERE guild_id = ? AND user_id = ?`,
            [interaction.guild.id, user.id]
        );
    } catch (error) {
        console.error('Error unbanning user:', error);
        await interaction.reply({ content: 'There was an error trying to unban this user.', flags: MessageFlags.Ephemeral });
    }
}