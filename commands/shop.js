const Discord = require('discord.js');
const palette = require('../colorset.json');
const fs = require('fs');
const formatManager = require('../utils/formatManager');
const databaseManager = require('../utils/databaseManager');

const sql = require("sqlite");
sql.open('.data/database.sqlite');

module.exports.run = async(bot, command, message,args) =>{
/// shop.js
///
///     SHOP COMMAND
///    changes log:
///
///     05/04/19 - Major reworks
///     02/26/19 - Ticket shop added.
///     12/02/18 - Interface revamp, simplifed structure & added multiple pages.
///     10/19/18 - integrated with buy.js updates.
///     09/17/18 - huge reworks in shop system. later will be divided by 2 kinds of shop.
///     09/29/18 - changed items.type from "ticket" -> "Tickets:"   -requested by FloofyFox

///     -naphnaphz

const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const format = new formatManager(message);

return [`sandbox`, `bot`, `gacha-house`, `games`].includes(message.channel.name) ? initShop()
: format.embedWrapper(palette.darkmatte, `Unavailable access.`)


async function initShop() {
    const collection = new databaseManager(message.author.id);
    const moji = (mojiname) => {
         return bot.emojis.find((x) => x.name === mojiname) 
    }

    const registerItems = (source, target, emoji=moji('ArtCoins')) => {
        let categories = []; 

        for (var i in source) { 
              if (!categories.includes(source[i].type)) {
                  categories.push(source[i].type)
              }
          }


        for (var i = 0; i < categories.length; i++) { 
            var tempDesc = '';
              for (var c in source) { 
                  if (categories[i] === source[c].type) {
                      let priceRange = format.threeDigitsComa(source[c].price);
                      tempDesc += `${emoji} ${priceRange} - **${source[c].name}**\n\`${source[c].desc}\`\n\n`; 
                  }
                }
               target.addField(categories[i], tempDesc);           
        }
    }


    const links = {
              gacha: `https://i.ibb.co/J3WVdWw/discordaau-gachabanner.png`,
              premiumcover: `https://i.ibb.co/pKLyV1b/discordaau-premiumcoverbanner.png`,
              ticket: `https://i.ibb.co/xSj6GSZ/discordaau-ticketbanner.png`,
              expbooster: `https://i.ibb.co/QQTGvF0/discordaau-expboosterbanner.png`,
              skin: `https://i.ibb.co/MCSDk5C/discordaau-skinbanner.png`,
              badge: `https://i.ibb.co/bBB2pPf/discordaau-badgebanner.png`,
              regularcover: `https://i.ibb.co/j6C06LS/discordaau-regularcover.png`,
    };



    //          WORKING ON NEW SHOP INTERFACE
    let registered_interface = [];
    async function interface(desc = "test", img, footer = "footer", type = "Tickets", emoji = "ArtCoins", opt1 = undefined, opt2 = undefined) {
            const page = new Discord.RichEmbed()
                .setDescription(desc)
                .setColor(palette.darkmatte)
                .setFooter(footer)
                .setImage(img)
                registerItems(await collection.classifyItem(type, opt1, opt2), page, moji(emoji));

                registered_interface.push(page);
    }


            async function run() {
                await interface(`Lucky Ticket has come!`, links.gacha, `[1 / 7] >redeem amount`, `Unique`, `artcoins`, `price < 130`);
                await interface(`May Special Cover!`, links.premiumcover, `[2 / 7]`, `Covers`, `magical_paper`, `price < 6`);
                await interface(`These are our general items!`, links.ticket, `[3 / 7]`, `Tickets`, `artcoins`,`_rowid_ < 3`);
                await interface(`Boost your social activities!`,  links.expbooster, `[4 / 7]`, `Tickets`, `artcoins`, `_rowid_ > 2`, `name DESC`);
                await interface(`Customize your card theme!`, links.skin, `[5 / 7]`, `Skins`, `artcoins`);
                await interface(`Grab your artistic badges!`, links.badge,  `[6 / 7]`, `Badges`, `artcoins`);
                await interface(`Beautify your profile cover!`, links.regularcover, `[7 / 7]`, `Covers`, `artcoins`, `price > 350`);



                message.channel.send(registered_interface[0])
                    .then(msg => {
                        msg.react('⏪').then(() => {
                        msg.react('⏩')

                        const backwardsFilter = (reaction, user) => (reaction.emoji.name === '⏪') && (user.id === message.author.id);
                        const forwardsFilter = (reaction, user) => (reaction.emoji.name === '⏩') && (user.id === message.author.id);            

                        const backwards = msg.createReactionCollector(backwardsFilter, { time: 60000 });
                        const forwards = msg.createReactionCollector(forwardsFilter, { time: 60000 });
                        let count = 0;

                        backwards.on('collect', r => {
                          r.remove(message.author)
                          count--

                            if(registered_interface[count]) { msg.edit(registered_interface[count]) }
                            else { count++ }

                        });
                        forwards.on('collect',  r => {
                          r.remove(message.author)
                          count++

                            if(registered_interface[count]) { msg.edit(registered_interface[count]) }
                            else { count-- }

                        });

                        setTimeout(() => {
                            msg.clearReactions();
                        }, 60000)
                    })
                })
            }

            return run();
}
}
module.exports.help = {
    name:"shop",
        aliases:[]
}