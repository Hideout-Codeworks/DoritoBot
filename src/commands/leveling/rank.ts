import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from 'discord.js';
import {checkSettings} from "../../utils/checkSettings";
import {getLevel, getNextLevelXP, getRank, getXP} from "../../helpers/dbLeveling";
import {checkCmdChannel} from "../../utils/checkCmdChannel";

export const data = new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your rank')
    .addUserOption((option) =>
        option.setName('target')
            .setDescription('Check rank for another member')
            .setRequired(false))

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    if (!(await checkSettings(interaction, "leveling"))) return;
    if (!(await checkCmdChannel(interaction))) return;

    const guildId = interaction.guild.id;
    const target = interaction.options.getUser('target') || interaction.user;
    const xpColor = 'E6D47B';
    const rankCardUrl = `https://vacefron.nl/api/rankcard?` +
        `username=${target.displayName}` +
        `&avatar=${target.avatarURL({size: 512, forceStatic: true})}` +
        `&level=${await getLevel(guildId, target.id)}` +
        `&rank=${await getRank(guildId, target.id)}` +
        `&currentxp=${await getXP(guildId, target.id)}` +
        `&nextlevelxp=${await getNextLevelXP(guildId, target.id)}` +
        `&previouslevelxp=0` +
        `&custombg=https://files.itz.sh/rankcard.png` +
        `&xpcolor=${xpColor}`;

    const embed = new EmbedBuilder()
        .setTitle(`${target.displayName}'s Rank Card`)
        .setImage(rankCardUrl)
        .setColor(`#${xpColor}`)

    await interaction.reply({ embeds: [embed] });
}