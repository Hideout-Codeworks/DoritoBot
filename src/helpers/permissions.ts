import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, MessageFlags } from 'discord.js';

export async function hasModerationPermission(interaction: ChatInputCommandInteraction): Promise<boolean> {
    const member = interaction.member as GuildMember;

    if (!member) {
        await interaction.reply({ content: 'Could not fetch your member data.', flags: MessageFlags.Ephemeral });
        return false;
    }

    if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: 'You do not have permission to timeout members.', flags: MessageFlags.Ephemeral });
        return false;
    }

    return true;
}

export async function botHasPermission(interaction: ChatInputCommandInteraction): Promise<boolean> {
    const bot = interaction.guild?.members.me;

    if (!bot) {
        await interaction.reply({ content: 'Could not fetch bot member data.', flags: MessageFlags.Ephemeral });
        return false;
    }

    if (!bot.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: 'I do not have permission to timeout members.', flags: MessageFlags.Ephemeral });
        return false;
    }

    return true;
}
