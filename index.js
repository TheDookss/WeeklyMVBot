// index.js
const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST, EmbedBuilder } = require('discord.js');

// ===== Bot Setup =====
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ===== Games list =====
// For each game, add name, channelId, and image URL
const games = [
  { name: 'Hollow Knight', channelId: 'CHANNEL_ID_1', image: 'https://i.imgur.com/abcd123.png' },
  { name: 'Dead Cells', channelId: 'CHANNEL_ID_2', image: 'https://i.imgur.com/efgh456.png' },
  { name: 'Ori and the Blind Forest', channelId: 'CHANNEL_ID_3', image: 'https://i.imgur.com/ijkl789.png' }
];

// ===== Slash Commands Setup =====
const commands = [
  new SlashCommandBuilder()
    .setName('game')
    .setDescription('Send a random game recommendation!')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), // put your bot's client ID in ENV too
      { body: commands },
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// ===== Bot Ready =====
client.once('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`);
  scheduleWeeklyGame();
});

// ===== Weekly Game Scheduler =====
function scheduleWeeklyGame() {
  // Time until next Monday 12:00 PM UTC
  const now = new Date();
  const nextMonday = new Date();
  nextMonday.setUTCDate(now.getUTCDate() + ((1 + 7 - now.getUTCDay()) % 7)); // 1 = Monday
  nextMonday.setUTCHours(12, 0, 0, 0); // 12:00 PM UTC

  const delay = nextMonday - now;
  setTimeout(() => {
    sendRandomGame();
    setInterval(sendRandomGame, 7 * 24 * 60 * 60 * 1000); // repeat every 7 days
  }, delay);
}

// ===== Send Random Game =====
async function sendRandomGame() {
  const game = games[Math.floor(Math.random() * games.length)];
  const channel = await client.channels.fetch(game.channelId);
  if (!channel) return console.error(`Channel ${game.channelId} not found`);

  const embed = new EmbedBuilder()
    .setTitle(`The Metroidvania of the Week is ${game.name}`)
    .setDescription(`Feel free to discuss it in <#${game.channelId}>!`)
    .setImage(game.image)
    .setColor(0x00FFFF);

  channel.send({ embeds: [embed] });
}

// ===== Slash Command Handler =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'game') {
    const game = games[Math.floor(Math.random() * games.length)];
    const embed = new EmbedBuilder()
      .setTitle(`Random Game: ${game.name}`)
      .setDescription(`Check it out in <#${game.channelId}>!`)
      .setImage(game.image)
      .setColor(0x00FFFF);
    await interaction.reply({ embeds: [embed] });
  }
});

// ===== Login =====
client.login(process.env.TOKEN);
