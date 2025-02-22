import { Interaction } from 'discord.js';
import { client } from '../index';

export const name = 'interactionCreate';
client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    const command = client.commands.get(commandName);
    if (command) {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
        }
    } else {
        await interaction.reply({ content: 'Command not found.', ephemeral: true });
    }
});
