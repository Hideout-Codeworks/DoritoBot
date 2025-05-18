import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    EmbedBuilder
} from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all bot commands')
    .addStringOption(option =>
        option.setName('category')
            .setDescription('The command category')
            .setRequired(true)
            .addChoices(
                { name: 'General Commands', value: 'general'},
                { name: 'Fun Commands', value: 'fun'},
                { name: 'Leveling', value: 'leveling'},
                { name: 'Moderation', value: 'moderation'},
                { name: 'Utilities', value: 'utilities'}
    ))

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
        return;
    }

    const option = interaction.options.getString('category');

    if (option === 'general') {
        try {
            const embed = new EmbedBuilder()
                .setColor('#e6d47b')
                .setTitle(`🛠️ General Commands`)
                .addFields(
                    { name: '`/help <category>`', value: 'Gives info about commands' },
                    { name: '`/setchannel <type> <channel>`', value: 'Set channels for bot features' },
                    { name: '`/settings list`', value: 'List the current settings for the bot' },
                    { name: '`/settings enable <feature>`', value: 'Enable a bot feature' },
                    { name: '`/settings disable <feature>`', value: 'Disable a bot feature' },
                    { name: '`/status`', value: `Get the bot's status` }
                )
                .setTimestamp()
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        } catch (error) {
            console.error("Error sending command help: ", error);
        }
    }

    if (option === 'fun') {
        try {
            const embed = new EmbedBuilder()
                .setColor('#e6d47b')
                .setTitle(`🎉 Fun Commands`)
                .addFields(
                    { name: '`/longcat [length]`', value: 'Sends a long cat emoji chain.' },
                    { name: '', value: 'More TBA' },
                )
                .setTimestamp()
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        } catch (error) {
            console.error("Error sending command help: ", error);
        }
    }

    if (option === 'leveling') {
        try {
            const embed = new EmbedBuilder()
                .setColor('#e6d47b')
                .setTitle(`<:upvote:1342725280548130866> Leveling Commands`)
                .addFields(
                    { name: '`/rank [target]`', value: "Checks someone's rank" },
                    { name: '`/top`', value: "Check top 10 leaderboard" },
                    { name: '`/levels noxp_add <channel>`', value: "Add a channel to be excluded from giving XP" },
                    { name: '`/levels noxp_rem <channel>`', value: "Remove a channel from exclusion" },
                    { name: '`/levels rewards_add <role> <level>`', value: "Add a level reward" },
                    { name: '`/levels rewards_rem <role>`', value: "Remove a level reward" },
                    { name: '`/levels notif_disable`', value: "Disable Level-Up Notifications" },
                    { name: '`/levels notif_enable`', value: "Enable Level-Up Notifications" }
                )
                .setTimestamp()
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        } catch (error) {
            console.error("Error sending command help: ", error);
        }
    }

    if (option === 'moderation') {
        try {
            const embed = new EmbedBuilder()
                .setColor('#e6d47b')
                .setTitle(`<:ban:1342495253164327094> Moderation Commands`)
                .addFields(
                    { name: '`/timeout add <target> <duration> [reason]`', value: 'Time out a member' },
                    { name: '`/timeout remove <target> [reason]`', value: 'Remove timeout from a member' },
                    { name: '`/kick <target> [reason]`', value: 'Kick a member from the Server' },
                    { name: '`/ban <target> [duration] [reason]`', value: 'Ban a member from the Server' },
                    { name: '`/unban <target> [reason]`', value: 'Unban a user from the Server' },
                    { name: '`/warn <target> <reason>`', value: 'Warn a member' },
                    { name: '`/warnings <target> [page]`', value: `List a member's warnings` }
                )
                .setTimestamp()
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        } catch (error) {
            console.error("Error sending command help: ", error);
        }
    }

    if (option === 'utilities') {
        try {
            const embed = new EmbedBuilder()
                .setColor('#e6d47b')
                .setTitle(`⚙️ Utility Commands`)
                .addFields(
                    { name: '`/snippet list`', value: 'List all snippets' },
                    { name: '`/snippet create  <name> <content>`', value: 'Add a snippet' },
                    { name: '`/snippet delete <name>`', value: 'Delete a snippet' },
                    { name: '`/snippet edit <name> [new_name] [new_content]`', value: 'Edit a snippet' },
                    { name: '`;<snippet>`', value: 'Show a snippet' },
                    { name: '`/trigger create <name> <trigger> <channels>`', value: 'Create a trigger for a snippet' },
                    { name: '`/trigger delete <trigger>`', value: 'Delete a snippet trigger' },
                    { name: '`/trigger edit <trigger> [new_trigger] [new_channels]`', value: 'Edit a snippet trigger' },
                    { name: '`/trigger list <name>`', value: 'List triggers for a snippet' }
                )
                .setTimestamp()
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        } catch (error) {
            console.error("Error sending command help: ", error);
        }
    }
}