import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('status')
    .setDescription('Get the bot\'s status, including uptime and memory usage.')

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {

    const uptime = process.uptime();

    const memoryUsage = process.memoryUsage();
    const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2); // MB
    const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2); // MB
    const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2); // MB

    const embed = new EmbedBuilder()
        .setColor('#E6D47B')
        .setTitle('Dorito Status <a:DoritoSpin:1341836811999248436>')
        .addFields(
            { name: 'Bot Uptime', value: formatUptime(uptime), inline: true },
            { name: 'Heap Used', value: `${heapUsed} MB`, inline: true },
            { name: 'Heap Total', value: `${heapTotal} MB`, inline: true },
            { name: 'RSS', value: `${rss} MB`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'DoritoBot Status' });

    await interaction.reply({ embeds: [embed] });}

function formatUptime(uptime: number): string {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
}