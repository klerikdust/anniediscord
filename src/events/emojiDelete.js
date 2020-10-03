module.exports = async (bot, emoji, configs) => {
    let metadata = {
        emoji: emoji,
        guild: emoji.guild,
        typeOfLog: `EMOJI_DELETE`,
        bot: bot
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}