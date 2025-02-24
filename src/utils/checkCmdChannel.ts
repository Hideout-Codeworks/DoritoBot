import {ChatInputCommandInteraction, MessageFlags} from "discord.js";
import {fetchGuildSettings} from "../helpers/fetchGuildSettings";


export async function checkCmdChannel(interaction: ChatInputCommandInteraction,): Promise<boolean> {
    if (!interaction.guild) return false;

    const settings = await fetchGuildSettings(interaction.guild.id);
    if (settings?.restrict_cmds && settings?.cmd_channel && interaction.channelId !== settings.cmd_channel) {
        await interaction.reply({content: `❌ Use commands in <#${settings.cmd_channel}>`, flags: MessageFlags.Ephemeral});
        return false;
    }

    return true;
}