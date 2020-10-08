module.exports = async (bot, guild, configs) => {    
    await bot.db.registerGuild(guild)
    let metadata = {
        guild: guild,
        configs: configs,
        typeOfLog: `GUILD_CREATE`,
        bot: bot
    }
    new bot.logSystem(metadata)
}