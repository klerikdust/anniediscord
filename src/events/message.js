const getUserPermission = require(`../libs/permissions`)
const autoResponderController = require(`../controllers/autoResponder`)
const commandController = require(`../controllers/commands`)
/**
 * Centralized Controller for handling incoming messages.
 * Mainly used to handle incoming message from user and calculate the possible actions
 * @since 4.0.1
 */
module.exports = (client, message) => {
    //  Ignore if its from a bot user
    if (message.author.bot) return client.logger.debug(`blocked bot-user message.`)
    //  Reject further flow if message is dm-typed.
    if (message.channel.type === `dm`) return client.logger.debug(`blocked incoming DM.`)
    let permission = getUserPermission(message, message.author.id)
    //  Ignore any user interaction in dev environment
    if (client.dev && permission.level < 4) return client.logger.debug(`[Event.message] ${message.author.id}@${message.guild.id} blocked in dev environment.`)
    //  Ran data validation on each user for every 1 minute.
    const dataValidateID = `DATA_VALIDATION@${message.author.id}`
    client.db.redis.get(dataValidateID).then(async res => {
        if (res !== null) return
        client.db.validateUser(message.author.id, message.guild.id, message.author.username)
        client.db.redis.set(dataValidateID, `1`, `EX`, 60)
    })
    //  Check if AR module is enabled.
    if (client.guilds.cache.get(message.guild.id).configs.get(`AR_MODULE`).value) autoResponderController(client, message)
    //  Check if message is identified as command.
    if (message.content.startsWith(client.prefix) && message.content.length >= (client.prefix.length + 1)) return commandController(client, message, permission)
    //  Automatically executing [Points Controller] when no other module requirements are met
    return client.pointsController(message)
}