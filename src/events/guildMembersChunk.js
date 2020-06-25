
module.exports = (bot, members, guild) => {
    var metadata = {
        guild: guild,
        members: members,
        typeOfLog: `guildMembersChunk`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.guildMembersChunk) new bot.logSystem(metadata).record()
}