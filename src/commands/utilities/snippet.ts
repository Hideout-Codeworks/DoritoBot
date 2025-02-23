import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    EmbedBuilder
} from 'discord.js';
import {addSnippet, deleteSnippet, editSnippet, getSnippet, getAllSnippets} from "../../helpers/dbManageSnippets";
import {client} from "../../main";

export const data = new SlashCommandBuilder()
    .setName('snippet')
    .setDescription('Manage snippets')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('create')
            .setDescription('Create a new snippet')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The snippet name')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('content')
                    .setDescription('The snippet content')
                    .setRequired(true))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('edit')
            .setDescription('Edit an existing snippet')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The snippet name to edit')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('new_name')
                    .setDescription('The new name for the snippet')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('new_content')
                    .setDescription('The new content for the snippet')
                    .setRequired(false))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('delete')
            .setDescription('Delete a snippet')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The snippet name to delete')
                    .setRequired(true))
    )
    .addSubcommand((subcommand) =>
    subcommand
        .setName('list')
        .setDescription('List of snippets')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page Number')
                .setRequired(false))
        );


export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
        return;
    }
    const guildId = interaction.guild.id;
    const authorId = interaction.user.id;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
        const name = interaction.options.getString('name', true);
        const content = interaction.options.getString('content', true);

        const existingSnippet = await getSnippet(guildId, name);
        if (existingSnippet) {
            await interaction.reply({ content: `A snippet with the name \`${name}\` already exists.`, flags: MessageFlags.Ephemeral });
            return;
        }

        const success = await addSnippet(guildId, authorId, name, content);
        if (success) {
            await interaction.reply({ content: `✅ Snippet \`${name}\` created successfully!`, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: '❌ Failed to create snippet.', flags: MessageFlags.Ephemeral });
        }
    }

    if (subcommand === 'edit') {
        const name = interaction.options.getString('name', true);
        const newName = interaction.options.getString('newname', false) ?? undefined;
        const newContent = interaction.options.getString('newcontent', false) ?? undefined;

        const existingSnippet = await getSnippet(guildId, name);
        if (!existingSnippet) {
            await interaction.reply({ content: `❌ Snippet \`${name}\` not found.`, flags: MessageFlags.Ephemeral });
            return;
        }

        if (!newName && !newContent) {
            await interaction.reply({ content: '❌ You must provide either a new name or new content.', flags: MessageFlags.Ephemeral });
            return;
        }

        const success = await editSnippet(guildId, name, newName, newContent);
        if (success) {
            await interaction.reply({ content: `✅ Snippet \`${name}\` updated successfully!`, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: '❌ Failed to update snippet.', flags: MessageFlags.Ephemeral });
        }
    }

    if (subcommand === 'delete') {
        const name = interaction.options.getString('name', true);

        const existingSnippet = await getSnippet(guildId, name);
        if (!existingSnippet) {
            await interaction.reply({ content: `❌ Snippet \`${name}\` not found.`, flags: MessageFlags.Ephemeral });
            return;
        }

        const success = await deleteSnippet(guildId, name);
        if (success) {
            await interaction.reply({ content: `✅ Snippet \`${name}\` deleted successfully!`, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: '❌ Failed to delete snippet.', flags: MessageFlags.Ephemeral });
        }
    }

    if (subcommand === 'list') {
        const page = (interaction.options.getInteger('page') ?? 1) - 1;
        const snippets = await getAllSnippets(guildId)
        if (snippets.length === 0) {
            await interaction.reply({content: "No snippets found on this Server.", flags: MessageFlags.Ephemeral })
            return;
        }

        const snippetsPerPage = 20;
        const totalPages = Math.ceil(snippets.length / snippetsPerPage);

        if (page < 0 || page >= totalPages) {
            await interaction.reply({
                content: `Invalid page number. Please provide a page between 1 and ${totalPages}.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const pageSnippets = snippets.slice(page * snippetsPerPage, (page + 1) * snippetsPerPage);

        try {
            const embed = new EmbedBuilder()
                .setTitle(`📌 Snippets for **${interaction.guild.name}**`)
                .setColor('#e6d47b')
                .setFooter({ text: `Page ${page + 1} out of ${totalPages} • Requested by ${interaction.user.tag}` });

            pageSnippets.forEach(snippet => {
                const updatedAtUnix = Math.floor(new Date(snippet.updated_at).getTime() / 1000);
                const author = client.users.cache.get(snippet.author_id)?.tag ?? snippet.author_id;
                embed.addFields({
                    name: `Snippet: \`${snippet.name}\``,
                    value: `Author: **${author}**\n-# 📝 <t:${updatedAtUnix}>`,
                    inline: false,
                });
            });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending snippet list:', error);
        }
    }
}