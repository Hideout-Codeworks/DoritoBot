import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, MessageFlags} from 'discord.js';
import {parseDurationMs, parseHumanDuration} from '../../helpers/parseDuration';
import {checkSettings} from "../../utils/checkSettings";

const MAX_TIMEOUT_DURATION = 2419200000;

export const data = new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('remove')
            .setDescription("Remove a member's timeout")
            .addUserOption(option =>
                option.setName('target')
                    .setDescription('The target member')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('Reason for removing the timeout')
                    .setRequired(false))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('add')
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
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    if (!(await checkSettings(interaction, "moderation"))) return;

    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getMember('target') as GuildMember;
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
        await interaction.reply({content: 'The specified member was not found.', flags: MessageFlags.Ephemeral});
        return;
    }

    if (subcommand === 'add') {
        const duration = interaction.options.getString('duration')!;

        if (target.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            await interaction.reply({content: 'You cannot timeout another moderator.', flags: MessageFlags.Ephemeral});
            return;
        }

        const durationMs = parseDurationMs(duration);

        if (!durationMs) {
            await interaction.reply({
                content: 'Invalid duration format. Use `10s`, `5m`, `1h`, `1w max`.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (durationMs > MAX_TIMEOUT_DURATION) {
            await interaction.reply({
                content: `The maximum timeout duration is 4 weeks.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        try {
            const humanDuration = parseHumanDuration(durationMs);
            await target.send({ content: `<:timeout:1342496377741250660> **You where timed out in ${interaction.guild.name}**\n-# **Reason:**\n\`${reason}\`\n-# **Duration:**\n\`${humanDuration}\``});
            await target.timeout(durationMs, `${interaction.user.tag}: ${reason}`);
            await interaction.reply({
                content: `<:timeout:1342496377741250660> Timed out \`${target.user.tag}\` for \`${humanDuration}\``,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error timing out user:', error);
            await interaction.reply({
                content: 'There was an error trying to timeout this member.',
                flags: MessageFlags.Ephemeral
            });
        }
    }

    if (subcommand === "remove") {
        try {
            await target.send({ content: `<:timeoutremove:1342997545395425432> **Your timed out in ${interaction.guild.name} was removed**\n-# **Reason:**\n\`${reason}\``});
            await target.timeout(null, `${interaction.user.tag}: ${reason}`);
            await interaction.reply({
                content: `<:timeoutremove:1342997545395425432> Time out removed from \`${target.user.tag}\``,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error removing timeout for user:', error);
            await interaction.reply({
                content: 'There was an error trying to remove the timeout for this member.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}
