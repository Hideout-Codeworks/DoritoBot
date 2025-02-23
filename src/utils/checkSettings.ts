import {ChatInputCommandInteraction, MessageFlags} from "discord.js";
import {fetchGuildSettings, GuildSettings} from "../helpers/fetchGuildSettings";
import {botHasPermission, hasModerationPermission} from "../helpers/permissions";


export async function checkSettings(
    interaction: ChatInputCommandInteraction,
    settingKey: keyof GuildSettings
): Promise<boolean> {
    if (!interaction.guild) {
        await interaction.reply({content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral});
        return false;
    }
    const settings = await fetchGuildSettings(interaction.guild.id);

    if (!settings || !Boolean(settings[settingKey])) {
        await interaction.reply({content: '❌ This command is disabled on this server.', flags: MessageFlags.Ephemeral});
        return false;
    }

    if (settingKey === "moderation") {
        const hasModPermission = await hasModerationPermission(interaction);
        const hasBotPermission = await botHasPermission(interaction);

        if (!hasModPermission || !hasBotPermission) {
            await interaction.reply({ content: "You aren't allowed to use this command!", flags: MessageFlags.Ephemeral });
            return false;
        }
    }
    return true;
}