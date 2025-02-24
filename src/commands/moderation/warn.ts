import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    GuildMember,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder, TextChannel
} from 'discord.js';
import { checkSettings } from "../../utils/checkSettings";
import {addWarnToDB} from "../../helpers/dbAddWarn";
import {fetchGuildSettings} from "../../helpers/fetchGuildSettings";

export const data = new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The member to warn')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for warning')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    if (!(await checkSettings(interaction, "moderation"))) return;

    const target = interaction.options.getMember('target') as GuildMember;
    const reason = interaction.options.getString('reason');

    if (!target) {
        await interaction.reply({ content: 'The specified member was not found.', flags: MessageFlags.Ephemeral });
        return;
    }

    if (target.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: 'You cannot warn another moderator.', flags: MessageFlags.Ephemeral });
        return;
    }

    try {
        await target.send({ content: `:warning: **You were warned on ${interaction.guild.name}**\n-# **Reason:**\n\`${reason}\``});
        const settings = await fetchGuildSettings(interaction.guild.id);
        if (settings && settings.logging === 1 && settings.modlog_channel) {
            const modlogChannel = interaction.guild.channels.cache.get(settings.modlog_channel) as TextChannel;
            if (modlogChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6666')
                    .setDescription(`:warning: **${target.user.tag}** was warned by **${interaction.user.tag}**`)
                    .addFields(
                        { name: '', value: `-# **Reason:**\n\`${reason}\``, inline: false}
                    )
                    .setFooter({text: 'Warn Action'})
                    .setTimestamp();
                await modlogChannel.send({embeds: [embed]});
            }
        }
        await addWarnToDB(interaction.guild.id, interaction.user.id, target.id, reason);
        await interaction.reply({
            content: `:warning: Warned \`${target.user.tag}\``,
            flags: MessageFlags.Ephemeral
        })
    } catch (error) {
        console.error('Error warning user:', error);
        await interaction.reply({ content: 'There was an error trying to warn this member.', flags: MessageFlags.Ephemeral });
    }
}