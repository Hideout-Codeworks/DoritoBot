import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder
} from 'discord.js';
import {checkSettings} from "../../utils/checkSettings";
import {
    getLevelSettings,
    LevelRewards,
    addLevelReward,
    removeLevelReward,
    updateNoXpChannels,
    enableNotifs, disableNotifs
} from "../../helpers/dbLeveling";
import {checkCmdChannel} from "../../utils/checkCmdChannel";

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
    .addSubcommand((subcommand) =>
        subcommand
            .setName('notif_disable')
            .setDescription('Disable Level-Up Notifications')
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('notif_enable')
            .setDescription('Enable Level-Up Notifications')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    if (!(await checkSettings(interaction, "leveling"))) return;
    if (!(await checkCmdChannel(interaction))) return;

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === 'noxp_add' || subcommand === 'noxp_rem') {
        const channel = interaction.options.getChannel('channel');
        if (!channel) return;

        const settings = await getLevelSettings(guildId);
        const channels = settings?.no_xp_channels ?? [];

        if (subcommand === 'noxp_add') {
            // @ts-ignore
            if (channels.includes(channel.id)) {
                await interaction.reply({
                    content: `❌ The channel <#${channel.id}> is already excluded from XP gain.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        } else if (subcommand === 'noxp_rem') {
            // @ts-ignore
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

    if (subcommand === 'rewards_add') {
        const role = interaction.options.getRole('role');
        const level = interaction.options.getInteger('level');
        if (!role || level === null) {
            await interaction.reply({
                content: '❌ You must specify both a role and a level.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const success = await addLevelReward(guildId, level, role.id);
        await interaction.reply({
            content: success ? `✅ Successfully added <@&${role.id}> at level ${level}.` : '❌ Failed to add role to level.',
            flags: MessageFlags.Ephemeral
        });
    } else if (subcommand === 'rewards_rem') {
        const role = interaction.options.getRole('role');

        if (!role) {
            await interaction.reply({
                content: '❌ You must specify a role to remove.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const success = await removeLevelReward(guildId, role.id);
        await interaction.reply({
            content: success ? `✅ Successfully removed <@&${role.id}> from rewards` : '❌ Failed to remove role from rewards.',
            flags: MessageFlags.Ephemeral
        });
    }

    if (subcommand === 'rewards_list') {
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

    if (subcommand === 'notif_disable') {
        const settings = await getLevelSettings(guildId)
        const notifs= settings?.level_notifs;
        if (notifs === 0) {
            await interaction.reply({ content: 'Level-Up Notifications are already disabled!', flags: MessageFlags.Ephemeral });
            return;
        } else if (notifs === 1) {
            const success = await disableNotifs(guildId);
            await interaction.reply({
                content: success ? `✅ Successfully disabled Level-Up Notifications!` : '❌ Failed to disable Level-Up Notifications.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
    if (subcommand === 'notif_enable') {
        const settings = await getLevelSettings(guildId)
        const notifs= settings?.level_notifs;
        if (notifs === 1) {
            await interaction.reply({ content: 'Level-Up Notifications are already enabled!', flags: MessageFlags.Ephemeral });
            return;
        } else if (notifs === 0) {
            const success = await enableNotifs(guildId);
            await interaction.reply({
                content: success ? `✅ Successfully enabled Level-Up Notifications!` : '❌ Failed to enable Level-Up Notifications.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}