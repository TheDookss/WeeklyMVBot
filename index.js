// index.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');

// --- CONFIG ---
const GAMES_FILE = './games.json'; // JSON file containing games
const DEFAULT_CHANNEL_ID = '1488681992470925475'; // replace with your Discord channel ID

// --- CREATE CLIENT ---
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// --- LOAD GAMES ---
let gamesData = { games: [], lastGame: null };

if (fs.existsSync(GAMES_FILE)) {
    gamesData = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf-8'));
} else {
    fs.writeFileSync(GAMES_FILE, JSON.stringify(gamesData, null, 2));
}

// --- READY EVENT ---
client.once('ready', async () => {
    console.log(`Bot is online as ${client.user.tag}`);
});

// --- SLASH COMMAND HANDLER ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'addgame') {
        const name = interaction.options.getString('name');
        const channel = interaction.options.getChannel('channel');
        const image = interaction.options.getString('image');

        // Save to JSON
        gamesData.games.push({
            name,
            channelId: channel.id,
            image: image || null
        });

        fs.writeFileSync(GAMES_FILE, JSON.stringify(gamesData, null, 2));
        await interaction.reply(`✅ Added game **${name}** to the list.`);
    }

    if (commandName === 'listgames') {
        if (gamesData.games.length === 0) {
            return interaction.reply('No games have been added yet.');
        }
        const gameList = gamesData.games.map(g => g.name).join('\n');
        await interaction.reply(`🎮 **Games:**\n${gameList}`);
    }
});

// --- FUNCTION TO PICK RANDOM GAME ---
function pickRandomGame() {
    if (gamesData.games.length === 0) return null;

    let game;
    do {
        game = gamesData.games[Math.floor(Math.random() * gamesData.games.length)];
    } while (gamesData.games.length > 1 && game.name === gamesData.lastGame);

    gamesData.lastGame = game.name;
    fs.writeFileSync(GAMES_FILE, JSON.stringify(gamesData, null, 2));
    return game;
}

// --- CRON JOB TO POST EVERY MONDAY ---
cron.schedule('0 12 * * 1', async () => { // every Monday at 12:00 UTC
    const game = pickRandomGame();
    if (!game) return console.log('No games in list.');

    const channel = await client.channels.fetch(game.channelId || DEFAULT_CHANNEL_ID);
    if (!channel) return console.log('Channel not found.');

    const embed = new EmbedBuilder()
        .setTitle(`🎮 Metroidvania of the Week: ${game.name}`)
        .setDescription(`Feel free to discuss it in <#${game.channelId || DEFAULT_CHANNEL_ID}>`)
        .setColor(0x00ff00);

    if (game.image) embed.setImage(game.image);

    channel.send({ embeds: [embed] });
});

// --- LOGIN ---
client.login(process.env.TOKEN);
