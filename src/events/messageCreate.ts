import {EmbedBuilder, Message} from 'discord.js';
import { client } from '../main';
import { getSnippet, getSnippetByID } from '../helpers/dbManageSnippets';
import { getAllTriggers } from '../helpers/dbManageTriggers';
import { fetchHastebinContent } from "../helpers/fetchHasteLinks";
import { fetchGuildSettings } from "../helpers/fetchGuildSettings";
import {addXP, getLevel} from "../helpers/dbLeveling";

//@ts-ignore
export const name = 'messageCreate';
client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild || message.channel.isDMBased()) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    const settings = await fetchGuildSettings(message.guild.id);
    if (!settings) return;

    async function handleSnippet(snippetName: string, message: any) {
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

    async function handleTrigger(triggerMatch: any, message: any) {
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

    async function handleLink(links: RegExpMatchArray, message: any) {
        const triggers = await getAllTriggers(guildId);
        if (!triggers) return;
        for (const link of links) {
            try {
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
            } catch (error) {
                console.error('Error processing link:', error);
            }
        }
    }

    async function handleXP(guildId: string, userId: string, message: any) {
        if (!settings) return;
        const XP_PER_MESSAGE = 15;

        const levelBefore = await getLevel(guildId, userId);
        await addXP(guildId, userId, XP_PER_MESSAGE);
        const levelAfter = await getLevel(guildId, userId);

        if (levelAfter > levelBefore) {
            if (settings.level_notifs === 1) {
                await message.channel.send({ content: `🎉 **${message.author.displayName}** leveled up to ${levelAfter}!` });
            }
            const rewards = settings.level_rewards ? JSON.parse(settings.level_rewards) : {};

            if (rewards[levelAfter]) {
                const member = await message.guild.members.fetch(userId);
                for (const roleId of rewards[levelAfter]) {
                    if (!member.roles.cache.has(roleId)) {
                        try {
                            await member.roles.add(roleId);
                        } catch (error) {
                            console.error(`Failed to add role ${roleId} to member:`, error);
                        }
                    }
                }
            }
        }
    }

    if (settings.utility) {
        if (message.content.startsWith(';')) {
            const snippetName = message.content.slice(1).trim();
            await handleSnippet(snippetName, message);
        }
        const triggers = await getAllTriggers(guildId);
        if (triggers) {
            const triggerMatch = triggers.find(trigger =>
                message.content.toLowerCase().includes(trigger.trigger.toLowerCase()) &&
                trigger.channels.includes(message.channel.id)
            );
            if (triggerMatch) {
                await handleTrigger(triggerMatch, message)
            }
        }

        const urlRegex = /(https?:\/\/\S+)/g;
        const links = message.content.match(urlRegex);
        if (links) {
            await message.react('👀');
            await handleLink(links, message)
        }
    }

    let noXpChannels: string[] = [];
    if (settings.no_xp_channels) {
        try {
            noXpChannels = JSON.parse(settings.no_xp_channels);
            if (!Array.isArray(noXpChannels)) {
                noXpChannels = [];
            }
        } catch (error) {
            console.error('Error parsing no_xp_channels:', error);
            noXpChannels = [];
        }
    }

    if (settings.leveling && !noXpChannels.includes(message.channel.id)) {
        await handleXP(guildId, userId, message)
    }
});
