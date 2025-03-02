import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ActivityType,
    MessageFlags,
} from 'discord.js';
import dotenv from "dotenv";
import {client} from "../../main";

dotenv.config();

export const data = new SlashCommandBuilder()
    .setName('setstatus')
    .setDescription("Set the bot's status.")
    .addStringOption(option =>
        option.setName('status')
            .setDescription('Type of channel to set')
            .setRequired(true))

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!client.user) return;
    const BOT_OWNER = process.env.BOT_OWNER ?? null;
    if (!BOT_OWNER) {
        await interaction.reply({
            content: 'No bot owner set in the `.env` file!',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    if (interaction.user.id !== BOT_OWNER) {
        await interaction.reply({
            content: "Only the bot owner can set the bot's global status!",
            flags: MessageFlags.Ephemeral
        })
    }

    const newStatus = interaction.options.getString('status') ?? null;
    if (!newStatus) {
        await interaction.reply({
            content: "You need to enter a new status!",
            flags: MessageFlags.Ephemeral
        })
        return;
    }

    if (interaction.user.id === BOT_OWNER) {
        try {
            client.user.setPresence({
                activities: [{
                    name: newStatus,
                    type: ActivityType.Custom,
                }],
                status: 'online'
            });
            await interaction.reply({
                content: `Successfully set the bot's status to \`${newStatus}\`!`,
                flags: MessageFlags.Ephemeral
            })
        } catch (error) {
            console.error('Error encountered while changing the bot status:', error);
        }
    }
}