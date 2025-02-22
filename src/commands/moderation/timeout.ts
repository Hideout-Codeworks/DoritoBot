import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, MessageFlags} from 'discord.js';
import { hasModerationPermission, botHasPermission } from '../../helpers/permissions';
import {parseDurationMs, parseHumanDuration} from '../../helpers/parseDuration';

const MAX_TIMEOUT_DURATION = 2419200000;

export const data = new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The member to timeout')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('duration')
            .setDescription('Timeout duration (max 4 weeks)')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the timeout')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {

    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
        return;
    }

    if (!await hasModerationPermission(interaction) || !await botHasPermission(interaction)) {
        await interaction.reply({content: "You aren't allowed to use this command!", flags: MessageFlags.Ephemeral});
        return;
    }

    const target = interaction.options.getMember('target') as GuildMember;
    const duration = interaction.options.getString('duration')!;
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
        await interaction.reply({ content: 'The specified member was not found.', flags: MessageFlags.Ephemeral });
        return;
    }

    if (target.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: 'You cannot timeout another moderator.', flags: MessageFlags.Ephemeral });
        return;
    }

    const durationMs = parseDurationMs(duration);

    if (!durationMs) {
        await interaction.reply({ content: 'Invalid duration format. Use `10s`, `5m`, `1h`, `1w max`.', flags: MessageFlags.Ephemeral });
        return;
    }

    if (durationMs > MAX_TIMEOUT_DURATION) {
        await interaction.reply({ content: `The maximum timeout duration is 4 weeks.`, flags: MessageFlags.Ephemeral });
        return;
    }

    try {
        const humanDuration = parseHumanDuration(durationMs);
        await target.timeout(durationMs, `${interaction.user.tag}: ${reason}`);
        await interaction.reply({
            content: `<:timeout:1342496377741250660> Timed out \`${target.user.tag}\` for \`${humanDuration}\``,
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        console.error('Error timing out user:', error);
        await interaction.reply({ content: 'There was an error trying to timeout this member.', flags: MessageFlags.Ephemeral });
    }
}
