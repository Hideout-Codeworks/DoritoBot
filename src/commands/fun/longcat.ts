import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import {checkSettings} from "../../utils/checkSettings";
import {checkCmdChannel} from "../../utils/checkCmdChannel";

const cooldowns = new Map<string, number>();

export const data = new SlashCommandBuilder()
    .setName('longcat')
    .setDescription('Sends a long cat emoji chain.')
    .addIntegerOption(option =>
        option.setName('length')
            .setDescription('Length of the long cat chain')
            .setRequired(false)
            .setMinValue(3)
            .setMaxValue(15) //Max length is 62 limited by discord message body max length
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!(await checkSettings(interaction, "fun"))) return;
    if (!(await checkCmdChannel(interaction))) return;
    const length = interaction.options.getInteger('length') ?? 3;
    let cat = "<:longcat1:1343073978238894150>";

    const now = Date.now();
    const cooldownTime = 60000;

    if (cooldowns.has(interaction.user.id) && now - cooldowns.get(interaction.user.id)! < cooldownTime) {
        const remainingTime = Math.ceil((cooldowns.get(interaction.user.id)! + cooldownTime - now) / 1000);
        return interaction.reply({
            content: `Long Cat is on cooldown. Please wait ${remainingTime} more seconds`,
            flags: MessageFlags.Ephemeral
        });
    }

    for (let i = 0; i < length - 2; i++) {
        cat = `${cat}\n<:longcat2:1343073969204625408>`;
    }

    cat = `${cat}\n<:longcat3:1343073962330034228>`;

    cooldowns.set(interaction.user.id, now);

    await interaction.reply({
        content: cat
    });

    setTimeout(() => {
        cooldowns.delete(interaction.user.id);
    }, cooldownTime);
}