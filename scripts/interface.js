const rl = require("readline-sync");
const fig = require("figlet-promised");
const chalk = require("chalk");

const TemplateInteract = require("./template");

module.exports = class UserInterface {
  constructor(title, options, client) {
    this.title = title;
    this.options = options;
    this.client = client;
    this.templateInteract = new TemplateInteract(client);
  }

  async inputLoop() {
    console.log(chalk.green(await fig(this.title)));
    this.logOptions();

    while (true) {
      let input = rl.prompt();
      await this.parseInput(input);
    }
  }

  async parseInput(input = "none") {
    for (let option of this.options) {
      if (input.toLowerCase().split(" ")[0] == option.split(" ")[0]) {
        switch (option.split(" ")[0]) {
          case "help": {
            this.logOptions();
            break;
          }

          case "scan": {
            console.log("SCAN STARTED");
            this.templateInteract.createTemplate(
              input.toLowerCase().split(" ")[1]
            );
            break;
          }

          case "generate": {
            console.log("GENERATION STARTED");
            await this.templateInteract.loadTemplate(
              input.toLowerCase().split(" ")[2],
              input.toLowerCase().split(" ")[1]
            );
            break;
          }
        }
      }
    }
  }

  logOptions() {
    for (let opN in this.options) {
      console.log(chalk.blue(this.options[opN]));
    }
  }
};
