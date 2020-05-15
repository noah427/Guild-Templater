require("dotenv").config();
const discord = require("discord.js");
const client = new discord.Client();

const Interface = require("./scripts/interface");

client.login(process.env.TOKEN);

setTimeout(() => {
  const ui = new Interface(
    "ServerGenerator",
    [
      "help [commandName]",
      "generate <templateName> <serverID>",
      "scan <serverID>",
    ],
    client
  );

  ui.inputLoop();
}, 2000);

