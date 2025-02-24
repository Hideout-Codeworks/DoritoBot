import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder
} from 'discord.js';
import {checkSettings} from "../../utils/checkSettings";
import {getLevelSettings, LevelRewards, updateLevelRewards, updateNoXpChannels} from "../../helpers/dbLeveling";

export const data = new SlashCommandBuilder()
    .setName('levels')
    .setDescription('Manage Leveling settings')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('noxp_add')
            .setDescription('Add a channel to be excluded from giving XP')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('The channel to exclude')
                    .setRequired(true))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('noxp_rem')
            .setDescription('Remove a channel from exclusion')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('The channel to remove from exclusion')
                    .setRequired(true))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('noxp_list')
            .setDescription('List excluded channels')
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('rewards_add')
            .setDescription('Add a level reward')
            .addRoleOption(option =>
                option.setName('role')
                    .setDescription('The reward role to set')
                    .setRequired(true))
            .addIntegerOption(option =>
            option.setName('level')
                .setDescription('The level to reward the role at')
                .setMinValue(1)
                .setMaxValue(200)
                .setRequired(true))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('rewards_rem')
            .setDescription('Remove a level reward')
            .addRoleOption(option =>
                option.setName('role')
                    .setDescription('The reward role to remove')
                    .setRequired(true))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('rewards_list')
            .setDescription('List all level rewards')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    if (!(await checkSettings(interaction, "leveling"))) return;

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === 'noxp_add' || subcommand === 'noxp_rem') {
        const channel = interaction.options.getChannel('channel');
        if (!channel) return;

        const settings = await getLevelSettings(guildId);
        const channels = settings?.no_xp_channels ?? [];

        if (subcommand === 'noxp_add') {
            if (channels.includes(channel.id)) {
                await interaction.reply({
                    content: `❌ The channel <#${channel.id}> is already excluded from XP gain.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        } else if (subcommand === 'noxp_rem') {
            if (!channels.includes(channel.id)) {
                await interaction.reply({
                    content: `❌ The channel <#${channel.id}> is not in the No XP list.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        const success = await updateNoXpChannels(guildId, channel.id, subcommand === 'noxp_add' ? 'add' : 'remove');
        await interaction.reply({
            content: success ? `✅ Successfully ${subcommand === 'noxp_add' ? 'added' : 'removed'} <#${channel.id}> ${subcommand === 'noxp_add' ? 'to' : 'from'} No XP channels.` : '❌ Failed to update settings.',
            flags: MessageFlags.Ephemeral
        });
    }

    if (subcommand === 'noxp_list') {
        const settings = await getLevelSettings(guildId);
        let channels: string[] = [];
        if (settings?.no_xp_channels) {
            try {
                channels = Array.isArray(settings.no_xp_channels)
                    ? settings.no_xp_channels
                    : JSON.parse(settings.no_xp_channels);
            } catch (error) {
                console.error('Error parsing no_xp_channels:', error);
            }
        }

        await interaction.reply({
            content: channels.length ? `Excluded XP Channels: ${channels.map(id => `<#${id}>`).join(', ')}` : 'No channels are excluded from XP gain.',
            flags: MessageFlags.Ephemeral
        });
    }

    if (subcommand === 'rewards_add' || subcommand === 'rewards_rem') {
        const role = interaction.options.getRole('role');
        const level = interaction.options.getInteger('level');

        if (!role || level === null) return;

        const settings = await getLevelSettings(guildId);
        const rewards: Record<number, string[]> = settings?.level_rewards ? JSON.parse(settings.level_rewards) : {};

        if (!(level in rewards)) {
            rewards[level] = [];
        }

        if (subcommand === 'rewards_add') {
            if (rewards[level].includes(role.id)) {
                await interaction.reply({
                    content: `❌ The role <@&${role.id}> is already assigned as a reward for level ${level}.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        } else if (subcommand === 'rewards_rem') {
            if (!rewards[level].includes(role.id)) {
                await interaction.reply({
                    content: `❌ The role <@&${role.id}> is not assigned as a reward for level ${level}.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        const success = await updateLevelRewards(guildId, level, role.id, subcommand === 'rewards_add' ? 'add' : 'remove');
        await interaction.reply({
            content: success ? `✅ Successfully ${subcommand === 'rewards_add' ? 'added' : 'removed'} <@&${role.id}> at level ${level}.` : '❌ Failed to update rewards.',
            flags: MessageFlags.Ephemeral
        });
    }


    if (subcommand === 'rewardslist') {
        const settings = await getLevelSettings(guildId);
        const rewards: LevelRewards = settings?.level_rewards ? JSON.parse(settings.level_rewards) : {};

        if (!Object.keys(rewards).length) {
            await interaction.reply({ content: 'No level rewards set.', flags: MessageFlags.Ephemeral });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('📜 Level Rewards')
            .setColor('#FFA500')
            .setDescription(Object.entries(rewards)
                .map(([level, roles]: [string, string[]]) => `**Level ${level}:** ${roles.map(id => `<@&${id}>`).join(', ')}`)
                .join('\n')
            );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}