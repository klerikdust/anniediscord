const Discord = require("discord.js");
const env = require('./.data/environment.json');
const moment = require('moment');
const palette = require('./colorset.json');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();
const fs = require("fs");
require("./utils/eventHandler")(bot)

const http = require('http');
const express = require('express');
const app = express();

//	Ping server
app.get("/", (request, response) => {
    console.log(`At ${Date.now()} ping was received`);
    response.sendStatus(200);
});

app.listen(process.env.PORT);
setInterval(() => {
    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);


//	Loading command modules.
fs.readdir("./commands/", (err, files) => {

    if (err) console.log(err);

    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if (jsfile.length <= 0) {
        console.log(`missing files`);
        return;
    }

    jsfile.forEach((f, i) => {
        let props = require(`./commands/${f}`);
        bot.commands.set(props.help.name, props);
        props.help.aliases.forEach(alias => {
            bot.aliases.set(alias, props.help.name)
        });
    });
    console.log(`${jsfile.length} command files have been loaded.`)
});


//	Client token.
const token = env.dev ? env.temp_token : process.env.TOKEN;
bot.login(token)
console.log(env.dev ? `Log-in as developer-mode.` : `Prod server started.`)

//  Bot Messaging via Console ♡
let y = process.openStdin()
y.addListener("data", res => {
    let x = res.toString().trim().split(/ +/g);
    let msg = x.join(" ")

     //  Modify These Values!
    let color = palette.red
    let channel = "sandbox"
    let enabletextwrapping = true; 

    if(enabletextwrapping){
        embedWrapper(channel, color, msg);
    } else {
        bot.channels.get(bot.channels.find(x => x.name === channel).id).send(msg);
    }
});

let embed = new Discord.RichEmbed();
const embedWrapper = (channel, color, content) => {
    embed.setColor(color)
    embed.setDescription(content)
    let channelid = bot.channels.find(x => x.name === channel).id
    return bot.channels.get(channelid).send(embed);
}