import {EmbedBuilder, Message} from 'discord.js';
import { client } from '../main';
import { getSnippet } from '../helpers/dbManageSnippets';

export const name = 'messageCreate';
client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.content.startsWith(';')) return;

    const guildId = message.guild?.id;
    if (!guildId) return;
    if (message.channel.isDMBased()) return;
    const snippetName = message.content.slice(1).trim(); // Remove ";" prefix

    const snippet = await getSnippet(guildId, snippetName);
    if (!snippet) return;
    const author = client.users.cache.get(snippet.author_id);
    if (!author) return;
    try {
        const embed = new EmbedBuilder()
            .setTitle(`📌 Snippet: ${snippet.name}`)
            .setDescription(snippet.content)
            .setColor('#e6d47b')
            .setFooter({ text: `Written by ${author.tag} • Requested by ${message.author.tag}` });

        await message.channel.send({ embeds: [embed] });

        await message.delete();
    } catch (error) {
        console.error('Error sending snippet:', error);
    }
});
