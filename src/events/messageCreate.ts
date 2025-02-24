import {EmbedBuilder, Message, MessageFlags} from 'discord.js';
import { client } from '../main';
import { getSnippet, getSnippetByID } from '../helpers/dbManageSnippets';
import { getAllTriggers } from '../helpers/dbManageTriggers';
import { fetchHastebinContent, isHastebinPage } from "../helpers/fetchHasteLinks";
import { fetchGuildSettings } from "../helpers/fetchGuildSettings";

export const name = 'messageCreate';
client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;
    if (message.channel.isDMBased()) return;
    const guildId = message.guild.id;
    const settings = await fetchGuildSettings(message.guild.id);
    if (!settings?.utility) return;

    if (message.content.startsWith(';')) {
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
    }

    const triggers = await getAllTriggers(guildId);
    if (!triggers) return;

    const messageContent = message.content.toLowerCase();
    const triggerMatch = triggers.find(trigger =>
        messageContent.includes(trigger.trigger.toLowerCase()) &&
        trigger.channels.includes(message.channel.id)
    );

    if (triggerMatch) {
        const snippet = await getSnippetByID(guildId, triggerMatch.snippet_id);
        if (!snippet) return;
        const author = client.users.cache.get(snippet.author_id);
        if (!author) return;

        try {
            const embed = new EmbedBuilder()
                .setTitle(`📌 Snippet: ${snippet.name}`)
                .setDescription(snippet.content)
                .setColor('#e6d47b')
                .setFooter({ text: `Written by ${author.tag} • Requested by ${message.author.tag}` });

            await message.reply({ content: "The following snippet could be relevant for you:", embeds: [embed] });
        } catch (error) {
            console.error('Error sending snippet:', error);
        }
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;  // Matches all URLs
    const links = message.content.match(urlRegex);

    if (links) {
        await message.react('👀');
        for (const link of links) {
            try {
                if (await isHastebinPage(link)) {
                    console.log('Hastebin content found in the page source!');
                    const content = await fetchHastebinContent(link);

                    if (content) {
                        const hasteTriggerMatch = triggers.find(trigger =>
                            content.toLowerCase().includes(trigger.trigger.toLowerCase()) &&
                            trigger.channels.includes(message.channel.id)
                        );

                        if (hasteTriggerMatch) {
                            const snippet = await getSnippetByID(guildId, hasteTriggerMatch.snippet_id);
                            if (!snippet) return;

                            const author = client.users.cache.get(snippet.author_id);
                            if (!author) return;

                            const embed = new EmbedBuilder()
                                .setTitle(`📌 Snippet: ${snippet.name}`)
                                .setDescription(snippet.content)
                                .setColor('#e6d47b')
                                .setFooter({ text: `Written by ${author.tag} • Requested by ${message.author.tag}` });

                            await message.reply({ content: "The following snippet could be relevant for you:", embeds: [embed] });
                        } else {
                            console.log('No trigger found in the page content.');
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing link:', error);
            }
        }
    }
});
