import {REST, Routes, SlashCommandBuilder, Client, GatewayIntentBits, Collection} from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const commandsPath = path.join(__dirname, 'commands');
const eventsPath = path.join(__dirname, 'events');

class MyClient extends Client {
    commands: Collection<string, { data: SlashCommandBuilder, execute: Function }>;
    constructor() {
        super({ intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildModeration
            ] });
        this.commands = new Collection();
    }
}

export const client = new MyClient;

async function loadCommands(dir: string) {
    const files = readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            await loadCommands(fullPath);
        } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
            const fileUrl = new URL(`file://${path.resolve(fullPath)}`);
            const command = await import(fileUrl.href);
            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
                console.log(`Loaded command: ${command.data.name}`);
            } else {
                console.warn(`Skipping invalid command in ${fullPath}`);
            }
        }
    }
}

async function loadEvents(dir: string) {
    const files = readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
            const fileUrl = new URL(`file://${path.resolve(fullPath)}`);
            try {
                const event = await import(fileUrl.href);
                if (event.name && typeof event.name === 'string' && typeof event.handler === 'function') {
                    console.warn(`Skipping invalid event in ${fullPath}`);
                    return;
                }

                // Check if `client.on` is already used inside the file and pass the event accordingly
                if (event.name && typeof event.name === 'string') {
                    console.log(`Loaded event: ${event.name}`);
                } else {
                    console.warn(`Skipping invalid event handler`);
                }
            } catch (error) {
                console.error(`Error loading event: ${file.name}`, error);
            }
        }
    }
}

export async function loadHelpers(dir: string) {
    const files = readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            await loadHelpers(fullPath);
        } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
            const fileUrl = new URL(`file://${path.resolve(fullPath)}`);
            try {
                await import(fileUrl.href);
                console.log(`Loaded helper: ${file.name}`);
            } catch (error) {
                console.error(`Error loading helper: ${file.name}`, error);
            }
        }
    }
}

async function main() {
    await loadEvents(eventsPath);
    await loadHelpers(path.join(__dirname, "helpers"));
    await loadCommands(commandsPath);
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
            body: Array.from(client.commands.values()).map(command => command.data.toJSON()),
        });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }

    const data = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID!));
    // @ts-ignore
    console.log('Registered commands:', data.length);
}

client.login(process.env.BOT_TOKEN).then(async () => {
    console.log('Bot logged in successfully.');
    await main();
}).catch((error) => {
    console.error('Failed to log in:', error);
});