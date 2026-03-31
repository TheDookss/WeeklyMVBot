const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const cron = require('node-cron');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const DATA_FILE = "games.json";
const ANNOUNCE_CHANNEL_ID = "PASTE_CHANNEL_ID_HERE";

let data = { games: [], lastGame: null };
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getRandomGame() {
  if (data.games.length === 0) return null;

  let filtered = data.games.filter(g => g.name !== data.lastGame);
  if (filtered.length === 0) filtered = data.games;

  const game = filtered[Math.floor(Math.random() * filtered.length)];
  data.lastGame = game.name;
  saveData();
  return game;
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "addgame") {
    const name = interaction.options.getString("name");
    const channel = interaction.options.getChannel("channel");
    const image = interaction.options.getAttachment("image");

    data.games.push({
      name,
      channelId: channel.id,
      image: image ? image.url : null
    });

    saveData();
    interaction.reply(`Added ${name}`);
  }

  if (interaction.commandName === "listgames") {
    if (data.games.length === 0) return interaction.reply("No games.");

    const list = data.games.map(g => `• ${g.name}`).join("\n");
    interaction.reply(list);
  }

  if (interaction.commandName === "preview") {
    const game = getRandomGame();
    if (!game) return interaction.reply("No games.");

    const embed = new EmbedBuilder()
      .setTitle("🎮 Preview")
      .setDescription(`${game.name}\n<#${game.channelId}>`)
      .setImage(game.image || null);

    interaction.reply({ embeds: [embed] });
  }
});

client.once('ready', () => {
  console.log("Bot is online");

  cron.schedule('0 9 * * 1', async () => {
    const game = getRandomGame();
    if (!game) return;

    const channel = await client.channels.fetch(ANNOUNCE_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("🎮 Metroidvania of the Week")
      .setDescription(`${game.name}\n<#${game.channelId}>`)
      .setImage(game.image || null);

    channel.send({ embeds: [embed] });
  });
});

client.login(process.env.TOKEN);