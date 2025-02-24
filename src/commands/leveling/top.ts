import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from 'discord.js';
import {checkSettings} from "../../utils/checkSettings";
import {getTopRanks} from "../../helpers/dbLeveling";

export const data = new SlashCommandBuilder()
    .setName('top')
    .setDescription('Check top ranks on the server')

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    if (!(await checkSettings(interaction, "leveling"))) return;

    const guildId = interaction.guild.id;
    const ranks = await getTopRanks(guildId, 10);
    const embed = new EmbedBuilder()
        .setTitle(`Rank Leaderboard`)
        .setColor(`#E6D47B`)
        .setDescription('Top 10 members based on XP:');

    ranks.forEach((user, index) => {
        embed.addFields({
            name: `**#${index + 1}** - \`${user.xp}\` XP`,
            value: `<@${user.userId}> - Level: \`${user.lvl}\``,
            inline: false,
        });
    });


    await interaction.reply({ embeds: [embed] });
}