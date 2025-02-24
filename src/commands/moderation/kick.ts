import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, MessageFlags} from 'discord.js';
import { checkSettings } from "../../utils/checkSettings";

export const data = new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The member to kick')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the timeout')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    if (!(await checkSettings(interaction, "moderation"))) return;

    const target = interaction.options.getMember('target') as GuildMember;
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
        await interaction.reply({ content: 'The specified member was not found.', flags: MessageFlags.Ephemeral });
        return;
    }

    if (target.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: 'You cannot kick another moderator.', flags: MessageFlags.Ephemeral });
        return;
    }

    try {
        await target.send({ content: `<:kick:1342698439431032833> **You where kicked from ${interaction.guild.name}**\n-# **Reason:**\n\`${reason}\``});
        await target.kick(`${interaction.user.tag}: ${reason}`)
        await interaction.reply({
            content: `<:kick:1342698439431032833> Kicked \`${target.user.tag}\``,
            flags: MessageFlags.Ephemeral
        })
    } catch (error) {
        console.error('Error kicking user:', error);
        await interaction.reply({ content: 'There was an error trying to kick this member.', flags: MessageFlags.Ephemeral });
    }
}