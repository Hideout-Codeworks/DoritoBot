import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    EmbedBuilder,
    PermissionFlagsBits
} from 'discord.js';
import { addTrigger, editTrigger, deleteTrigger, getTriggers } from "../../helpers/dbManageTriggers";
import { checkSettings } from "../../utils/checkSettings";

export const data = new SlashCommandBuilder()
    .setName('trigger')
    .setDescription('Manage snippet triggers')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('create')
            .setDescription('Create a new trigger')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The snippet name')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('trigger')
                    .setDescription('The trigger word/phrase')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('channels')
                    .setDescription('The channels the trigger should listen in')
                    .setRequired(true))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('edit')
            .setDescription('Edit an existing trigger')
            .addStringOption(option =>
                option.setName('trigger')
                    .setDescription('The trigger to edit')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('new_trigger')
                    .setDescription('The new trigger word/phrase')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('new_channels')
                    .setDescription('The new channels it should trigger in')
                    .setRequired(false))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('delete')
            .setDescription('Delete a trigger')
            .addStringOption(option =>
                option.setName('trigger')
                    .setDescription('The trigger to delete')
                    .setRequired(true))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('list')
            .setDescription('List triggers for a snippet')
            .addStringOption(option => // Change to string since it's a snippet name
                option.setName('name')
                    .setDescription('Name of the snippet')
                    .setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);


export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    if (!(await checkSettings(interaction, "utility"))) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
        const snippetName = interaction.options.getString('name')!;
        const trigger = interaction.options.getString('trigger')!;
        const channelsString = interaction.options.getString('channels');
        const channelIds: string[] = channelsString
            ? channelsString
                .split(' ')
                .map(channelMention => {
                    const match = channelMention.match(/<#(\d+)>/);
                    return match ? match[1] : null;
                })
                .filter((id): id is string => id !== null)
            : [];

        if (channelIds.length === 0) {
            await interaction.reply({ content: 'You must provide at least one valid channel.', flags: MessageFlags.Ephemeral });
            return;
        }

        const success = await addTrigger(interaction.guild.id, snippetName, trigger, channelIds);

        if (success) {
            await interaction.reply({ content: `Trigger "${trigger}" for snippet "${snippetName}" has been created successfully!`, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: `Failed to create the trigger. Please try again later.`, flags: MessageFlags.Ephemeral });
        }
    }

    if (subcommand === 'edit') {
        const triggerName = interaction.options.getString('trigger')!;
        const newTrigger = interaction.options.getString('new_trigger');
        const newChannelsString = interaction.options.getString('new_channels');

        const channelIds: string[] = newChannelsString
            ? newChannelsString
                .split(' ')
                .map(channelMention => {
                    const match = channelMention.match(/<#(\d+)>/);
                    return match ? match[1] : null;
                })
                .filter((id): id is string => id !== null)
            : [];

        if (!triggerName) {
            await interaction.reply({ content: 'You must specify the trigger to edit.', flags: MessageFlags.Ephemeral });
            return;
        }

        const success = await editTrigger(
            interaction.guild.id,
            triggerName,
            newTrigger || undefined,
            channelIds.length > 0 ? channelIds.join(',') : undefined
        );

        if (success) {
            await interaction.reply({ content: `Trigger "${triggerName}" has been updated successfully.`, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: `Failed to update the trigger. Please ensure it exists or try again later.`, flags: MessageFlags.Ephemeral });
        }
    }

    if (subcommand === 'delete') {
        const triggerName = interaction.options.getString('trigger')!;

        const success = await deleteTrigger(interaction.guild.id, triggerName);

        if (success) {
            await interaction.reply({ content: `Trigger "${triggerName}" has been deleted successfully.`, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: `Failed to delete the trigger. Please ensure the trigger exists or try again later.`, flags: MessageFlags.Ephemeral });
        }
    }

    if (subcommand === 'list') {
        const snippetName = interaction.options.getString('name')!;

        const triggers = await getTriggers(interaction.guild.id, snippetName);

        if (triggers.length > 0) {
            const embed = new EmbedBuilder()
                .setTitle(`Triggers for snippet "${snippetName}"`)
                .setDescription(triggers.map(t => `**Trigger:** ${t.trigger} \n**Channels:** ${t.channels.join(', ')}`).join('\n\n'))
                .setColor('#3498db');

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: `No triggers found for snippet "${snippetName}".`, flags: MessageFlags.Ephemeral });
        }
    }
}
