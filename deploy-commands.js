const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('addgame')
    .setDescription('Add a game')
    .addStringOption(o => o.setName('name').setRequired(true))
    .addChannelOption(o => o.setName('channel').setRequired(true))
    .addAttachmentOption(o => o.setName('image')),

  new SlashCommandBuilder()
    .setName('listgames')
    .setDescription('List games'),

  new SlashCommandBuilder()
    .setName('preview')
    .setDescription('Preview game')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands("YOUR_CLIENT_ID"),
    { body: commands }
  );
})();