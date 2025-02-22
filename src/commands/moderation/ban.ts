import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    MessageFlags,
} from 'discord.js';
import { hasModerationPermission, botHasPermission } from '../../helpers/permissions';
import {parseDurationMs, parseHumanDuration} from '../../helpers/parseDuration';
import {addBanToDB} from "../../helpers/dbInsertBan";

export const data = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The member to ban')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the ban')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('duration')
            .setDescription('Ban duration')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
        await interaction.reply({content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral});
        return;
    }

    if (!await hasModerationPermission(interaction) || !await botHasPermission(interaction)) {
        await interaction.reply({content: "You aren't allowed to use this command!", flags: MessageFlags.Ephemeral});
        return;
    }

    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const duration = interaction.options.getString('duration') || 'Permanent';

    if (!target) {
        await interaction.reply({ content: 'The specified user was not found.', flags: MessageFlags.Ephemeral });
        return;
    }

    const member = interaction.guild.members.cache.get(target.id);

    if (member && member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: 'You cannot ban another moderator.', flags: MessageFlags.Ephemeral });
        return;
    }

    const durationMs = parseDurationMs(duration);

    if (duration !== 'Permanent' && !durationMs) {
        await interaction.reply({ content: 'Invalid duration format. Use `10s`, `5m`, `1h`, `1w max`.', flags: MessageFlags.Ephemeral });
        return;
    }

    try {
        const durationMs = parseDurationMs(duration);
        const reasonText = `${interaction.user.tag}: ${duration !== 'Permanent' ? parseHumanDuration(durationMs) : 'Permanent'}: ${reason}`;

        await interaction.guild.bans.create(target.id, { reason: reasonText });

        if (duration !== 'Permanent' && durationMs) {
            const bannedUntil = new Date(Date.now() + durationMs).toISOString().split('.')[0].replace('T', ' ');
            await addBanToDB(interaction.guild.id, target.id, bannedUntil);
            await interaction.reply({
                content: `<:ban:1342495253164327094> Banned \`${target.tag}\` for \`${parseHumanDuration(durationMs)}\``,
                flags: MessageFlags.Ephemeral
            })
        } else if (duration === 'Permanent') {
            await interaction.reply({
                content: `<:ban:1342495253164327094> Banned \`${target.tag}\` permanently`,
                flags: MessageFlags.Ephemeral
            })
        }
    } catch (error) {
        console.error('Error banning user:', error);
        await interaction.reply({ content: 'There was an error trying to ban this member.', flags: MessageFlags.Ephemeral });
    }
}