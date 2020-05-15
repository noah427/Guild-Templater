const fs = require("fs");

module.exports = class TemplateInteract {
  constructor(client) {
    this.client = client;
  }

  createTemplate(serverID) {
    const template = new Template(serverID, this.client);

    template.dumpToFile();
  }

  async loadTemplate(serverID, serverName) {
    const guild = this.client.guilds.cache.get(serverID);
    const info = JSON.parse(fs.readFileSync(`./templates/${serverName}.json`));

    guild.setName(info.serverName);

    for (let role of info.roles) {
      await guild.roles.create({
        data: {
          name: role.name,
          color: role.hexColor,
          position: role.position,
          hoist: role.hoisted,
          mentionable: role.mentionable,
          permissions: role.perms,
        },
      });
    }

    let categories = info.channels.filter(
      (channel) => channel.type == "category"
    );
    for (let category of categories) {
      await category.permissions.map(async (override, i) => {
        let rOver = category.permissions[i];
        rOver.id = await guild.roles.cache.find(
          (role) => role.name == category.permissions[i].id
        ).id;
        return rOver;
      });

      let parent = await guild.channels.create(category.name, {
        type: category.type,
        position: category.position,
        permissionOverwrites: category.permissions,
      });
      for (let child of category.children) {
        await child.permissions.map(async (override, i) => {
          let rOver = child.permissions[i];
          rOver.id = await guild.roles.cache.find(
            (role) => role.name == child.permissions[i].id
          ).id;
          return rOver;
        });

        await guild.channels.create(child.name, {
          type: child.type,
          position: child.position,
          parent: parent,
          nsfw: child.nsfw,
          topic: child.topic,
          permissionOverwrites: child.permissions,
        });
      }
    }

    for (let channel of info.channels.filter(
      (channel) => channel.type != "category" && !channel.parent
    )) {
      await guild.channels.create(child.name, {
        type: child.type,
        position: child.position,
        nsfw: child.nsfw,
        topic: child.topic,
        permissionOverwrites: child.permissions,
      });
    }
  }
};

class Template {
  constructor(serverID, client) {
    this.serverID = serverID;
    this.info = {};
    this.client = client;
    this.scan();
  }

  dumpToFile() {
    fs.writeFileSync(
      `./templates/${this.info.serverName.replace(" ", "-")}.json`,
      JSON.stringify(this.info)
    );
  }

  scan() {
    const guild = this.client.guilds.cache.get(this.serverID);
    this.info.serverName = guild.name;

    this.info.roles = [];

    guild.roles.cache
      .filter((role) => !role.managed && role.name != "@everyone")
      .forEach((rawRole) => {
        let role = new Role(
          rawRole.name,
          rawRole.position,
          rawRole.mentionable,
          rawRole.hexColor,
          rawRole.permissions.bitfield,
          rawRole.hoisted
        );
        this.info.roles.push(role);
      });

    this.info.channels = [];

    guild.channels.cache
      .filter((channel) => channel.type == "category")
      .forEach((category) => {
        var permissionOverrides = [];
        if (category.permissionOverwrites)
          category.permissionOverwrites
            .filter((override) => override.type == "role")
            .forEach((override) => {
              permissionOverrides.push(
                new Override(
                  override.deny.bitfield,
                  override.allow.bitfield,
                  guild.roles.cache.get(override.id).name
                )
              );
            });

        let children = [];

        category.children.forEach((child) => {
          var permissionOverrides = [];
          if (child.permissionOverwrites)
            child.permissionOverwrites
              .filter((override) => override.type == "role")
              .forEach((override) => {
                permissionOverrides.push(
                  new Override(
                    override.deny.bitfield,
                    override.allow.bitfield,
                    guild.roles.cache.get(override.id).name
                  )
                );
              });
          children.push(
            new Channel(
              child.name,
              child.type,
              permissionOverrides,
              child.nsfw,
              child.topic
            )
          );
        });

        let storedCat = new Category(
          category.name,
          permissionOverrides,
          children,
          category.position
        );
        this.info.channels.push(storedCat);
      });

    guild.channels.cache
      .filter((channel) => channel.type != "category" && !channel.parent)
      .forEach((channel) => {
        var permissionOverrides = [];

        if (channel.permissionOverwrites)
          channel.permissionOverwrites
            .filter((override) => override.type == "role")
            .forEach((override) => {
              permissionOverrides.push(
                new Override(
                  override.deny.bitfield,
                  override.allow.bitfield,
                  guild.roles.cache.get(override.id).name
                )
              );
            });
        this.info.channels.push(
          new Channel(
            channel.name,
            channel.type,
            permissionOverrides,
            channel.nsfw,
            channel.topic
          )
        );
      });

    // console.log(this.info);
  }
}

class Override {
  constructor(deny, allow, roleName) {
    this.id = roleName;
    this.type = "role";
    this.deny = deny;
    this.allow = allow;
  }
}

class Category {
  constructor(name, permissions, children, position) {
    this.type = "category";
    this.name = name;
    this.permissions = permissions;
    this.children = children;
    this.position = position;
  }
}

class Channel {
  constructor(name, type, permissions, nsfw, topic) {
    this.type = type;
    this.name = name;
    this.permissions = permissions;
    this.nsfw = nsfw;
    this.topic = topic;
  }
}

class Role {
  constructor(name, position, mentionable, hexColor, perm, hoisted) {
    this.name = name;
    this.position = position;
    this.mentionable = mentionable;
    this.hexColor = hexColor;
    this.perm = perm;
    this.hoisted = hoisted;
  }
}
