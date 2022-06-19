module.exports = async function guildCreate(client, guild) {    
    client.db.registerGuild(guild)
    client.registerGuildConfigurations(guild.id)
    //  Limit logging utility to support server only
    //  Perform logging to support server
    client.shard.broadcastEval(c => {c.channels.cache.has(`797521371889532988`) ? c.channels.cache.get(`797521371889532988`).send(`NEW_NODE:: ${guild.id}@${guild.name}`) : null})
    //  Notify owner of the server.
    const owner = await client.users.fetch(guild.ownerID)
    client.responseLibs(owner, true)
    .send(`**Hello!♡** thanks for inviting me to your server!\nTo get your started, type **\`${client.prefix}help\`** in the server to see all my available commands. \n\nBut for further informations, you can try ask it directly to the developers at link below. ${await client.getEmoji(`AnnieHeartHug`)}\n[Join my Support Server!](${client.supportServer})`, {
        image: `banner_help`
    })
    .catch(e => e)
}
