# DoritoBot
"Bocchi the Rock!"-Themed General Purpose and Moderation Discord Bot by itzMiney

## Features
- [x] Moderation Commands
- [x] Tempbans
- [x] Warning System
- [x] Punishment DMs
- [x] Snippet System
- [x] Moderation Logging
- [ ] Leveling System
- [ ] Gacha System

...and various other useful utility and fun commands!

## Installation
If you want to host this bot yourself, here's a small guide on how to do it! This guide uses Debian Linux, but the general steps are the same. Some commands may vary on different operating systems.

### 1. Clone the Repository
```sh
git clone https://github.com/itzMiney/DoritoBot.git
cd DoritoBot
```

### 2. Install Dependencies
To install all the required dependencies, run:
```sh
npm install
```

### 3. Install MariaDB
We'll need MariaDB for the database the bot uses. You can install it by running the following commands:
```
curl -LsS https://r.mariadb.com/downloads/mariadb_repo_setup | sudo bash
```

### 4. Set Up the Database
After MariaDB is installed, you need to set up the database for the bot. Run the following commands:
```sql
mariadb -u root -p
CREATE USER 'doritobot'@'127.0.0.1' IDENTIFIED BY 'strongPassword';
CREATE DATABASE doritobot;
GRANT ALL PRIVILEGES ON doritobot.* TO 'doritobot'@'127.0.0.1';
FLUSH PRIVILEGES;
exit;
```
Next, import the initial schema for the database:
```sql
mysql -u root -p doritobot < db_migrations/initial-schema.sql
```

### 5. Configure the Bot
Copy the example .env file and edit it with your bot’s credentials:
```sh
cp example.env .env
nano .env
```
This file should look something like this:
```env
# General Bot Settings
BOT_TOKEN="yourTokenHere"
CLIENT_ID="1234567890123456"

# Database Setup
DB_HOST="127.0.0.1"
DB_USER="doritobot"
DB_PASSWORD="strongPassword"
DB_NAME="doritobot"
```
- **BOT_TOKEN**: You can get your bot token by visiting the[Discord Developer Portal](https://discord.com/developers). Create an application, go to the Bot tab, and click "Reset Token" to generate your Bot Token.
- Make sure to enable **all 3 Privileged Gateway Intents** under the "Privileged Gateway Intents" section of the bot tab in the Discord Developer Portal.
- Head over to the OAuth2 tab to get your Client ID.

### 6. Running the Bot
Once everything is set up, you can start the bot by running:
```sh
npm start
```
