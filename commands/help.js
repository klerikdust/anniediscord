const Discord = require('discord.js');
const formatManager = require('../utils/formatManager.js');
const palette = require(`../colorset.json`);
const fs = require(`fs`);

const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message, args, utils) => {
	
	/// help.js
    ///
    ///  Help command
    ///    change logs:
    ///		  11/12/18 - Interface reworks.
    ///	  	  11/01/18 - Added leaderboard (xp, ac) & server invite. Removed report cmd.
    ///		  10/18/18 - Halloween palette
    ///       09/17/18 - Major changes. Including embed structures & infos.
    ///       
    ///
    ///     -naphnaphz


if(env.dev && !env.administrator_id.includes(message.author.id))return;

const format = new formatManager(message);
return ["sandbox", `bot`].includes(message.channel.name) ? initHelp()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)


async function aliases() {
// Time promise

    let file_arr = [];
    fs.readdir("./commands/", (err, files) => {
        if(err) console.log(err);
        
        for(let file in files) {
            const src = require(`./${files[file]}`);
            file_arr.push(src.help.name);
        }
    })
    await utils.pause(500)
    return file_arr;
};


async function initHelp() {
    let file_list = await aliases();
    const formatted_list = file_list.map(e => `\`${e}\``);
    

    const header = new Discord.RichEmbed()
          .setColor(palette.darkmatte)
          .setThumbnail(bot.user.displayAvatarURL)
          .setDescription(`<:AnnieHi:501524470692053002> **Hello, I'm Annie!**\nBelow are my commands documentation.\n\n
            -> **General**
            \`balance\`, \`profile\`, \`level\`, \`daily\`, \`inventory\`
            \`collection\`, \`rep\`, \`gift\`, \`setdesc\`, \`cartcoin\`

            -> **Fun**
            \`ask\`, \`avatar\`, \`coinflip\`

            -> **Shop-related**
            \`eat\`, \`buy\`, \`pay\`, \`redeem\`, \`shop\`, \`r.shop\`
            \`roll\`, \`multi-roll\`,

            -> **Server**
            \`stats\`, \`ping\`, \`invite\`, \`join\` 
      `);


      return message.channel.send(header)
            .then(() => {
                format.embedWrapper(palette.halloween, `Need further help? Please DM <@507043081770631169>.`);
            });
}
}
module.exports.help = {
    name:"help",
    aliases: [],
    description: `gives a list of current commands`,
    usage: `${prefix}help`,
    group: "General",
    public: true,
}