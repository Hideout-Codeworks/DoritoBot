import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    GuildMember,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder
} from 'discord.js';
import { checkSettings } from "../../utils/checkSettings";
import { listWarns } from "../../helpers/dbAddWarn";
import {client} from "../../main";

export const data = new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Check a members warnings')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The member to check')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('page')
            .setDescription('Page Number')
            .setRequired(false)
            .setMinValue(1))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    if (!(await checkSettings(interaction, "moderation"))) return;

    const target = interaction.options.getMember('target') as GuildMember;

    if (!target) {
        await interaction.reply({ content: 'The specified member was not found.', flags: MessageFlags.Ephemeral });
        return;
    }

    const page = (interaction.options.getInteger('page') ?? 1) - 1;
    const warns = await listWarns(interaction.guild.id, target.id);
    if (warns.length === 0) {
        await interaction.reply({content: "No warnings found for this member.", flags: MessageFlags.Ephemeral })
        return;
    }

    const warnsPerPage = 20;
    const totalPages = Math.ceil(warns.length / warnsPerPage);

    if (page >= totalPages) {
        await interaction.reply({
            content: `Invalid page number. Please provide a page between 1 and ${totalPages}.`,
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const pageWarns = warns.slice(page * warnsPerPage, (page + 1) * warnsPerPage);

    try {
        const embed = new EmbedBuilder()
            .setTitle(`:warning: Warnings for **${target.user.tag}**`)
            .setColor('#ff6666')
            .setFooter({ text: `Page ${page + 1} out of ${totalPages} • Requested by ${interaction.user.tag}` });

        pageWarns.forEach(warning => {
            const createdAtUnix = Math.floor(new Date(warning.created_at).getTime() / 1000);
            const mod = client.users.cache.get(warning.mod_id)?.tag ?? warning.mod_id;
            embed.addFields({
                name: `Reason: \`${warning.reason}\``,
                value: `-# 📛 Moderator: **${mod}**\n-# 📝 <t:${createdAtUnix}>`,
                inline: false,
            });
        });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
    } catch (error) {
        console.error('Error fetching warns for user:', error);
        await interaction.reply({ content: 'There was an error trying to fetch warnings for this member.', flags: MessageFlags.Ephemeral });
    }

}