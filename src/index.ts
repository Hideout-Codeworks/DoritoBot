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
        super({ intents: [GatewayIntentBits.Guilds] });
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
            import(fileUrl.href).then((event) => {
                if (event.name && event.execute) {
                    client.on(event.name, event.execute);
                    console.log(`Loaded event: ${event.name}`);
                } else {
                    console.warn(`Skipping invalid event in ${fullPath}`);
                }
            });
        }
    }
}

async function main() {
    await loadCommands(commandsPath);
    await loadEvents(eventsPath);
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