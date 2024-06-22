"use strict"
const {
    REST
} = require(`@discordjs/rest`)
const {
    Routes
} = require(`discord.js`)

/**
 * 
 * @param {Object} object logger, commands, guildOnly
 * @returns {null}
 */
module.exports = function applicationCommandLoader({
    logger,
    commands,
    guildOnly
}) {
    const rest = new REST({
        version: `10`
    }).setToken(process.env.BOT_TOKEN)

    const NODE_ENVIRONMENT_CLIENT_ID = process.env.NODE_ENV === `production` ? `501461775821176832` : process.env.NODE_ENV === `production_beta` ? `788001359349547039` : null

    if (!NODE_ENVIRONMENT_CLIENT_ID && process.env.NODE_ENV !== `development`) { return process.exit(9) }


    const CLEARCMD = false // USED ONLY IN DEVELOPMENT

    function formatDescriptions(command) {
        if (command.type === 3) return command.description = null
        return command.description.length >= 100 ? command.description = `${command.description.substring(0, 90)}...` : command.description
    }

    if (guildOnly) {
        return loadGuildOnly()
    } else {
        commands.forEach(item => {
            formatDescriptions(item)
        })
        return load()
        async function load() {
            try {
                logger.info(`[load] Started refreshing application (/) commands.`)
                if (process.env.NODE_ENV === `production` || process.env.NODE_ENV === `production_beta`) {
                    await rest.put(
                        Routes.applicationCommands(NODE_ENVIRONMENT_CLIENT_ID), {
                        body: commands
                    },
                    )
                } else {
                    if (process.env.NODE_DEV_CLIENT === `PAN`) {
                        /**
                         * For Pan's local bot use only
                         */
                        // Annie support server
                        await rest.put(
                            Routes.applicationGuildCommands(`514688969355821077`, `577121315480272908`), {
                            body: CLEARCMD ? [] : commands
                        },
                        )
                        // Pan's test server
                        await rest.put(
                            Routes.applicationGuildCommands(`514688969355821077`, `597171669550759936`), {
                                body: CLEARCMD ? [] : commands
                        },
                        )
                    } else if (process.env.NODE_DEV_CLIENT === `NAPH`) {
                        /**
                         * For Naph's local bot use only
                         */
                        await rest.put(
                            Routes.applicationGuildCommands(`581546189925646350`, `577121315480272908`), {
                            body: commands
                        },
                        )
                    }
                }
                logger.info(`[load] Successfully reloaded application (/) commands. ${commands.size} Commands`)
            } catch (error) {
                logger.error(error)
            }
        }
    }

    async function loadGuildOnly() {
        try {
            logger.info(`[load guild] Started refreshing application guild (/) Servers.`)
            if (process.env.NODE_ENV === `production` || process.env.NODE_ENV === `production_beta`) {
                for (const [serverId, commandObj] of commands.entries()) {
                    commandObj.forEach(item => {
                        formatDescriptions(item)
                    })
                    await rest.put(
                        Routes.applicationGuildCommands(NODE_ENVIRONMENT_CLIENT_ID, serverId), {
                            body: CLEARCMD ? [] : commandObj
                    },
                    )
                }
            } else {
                if (process.env.NODE_DEV_CLIENT === `PAN`) {
                    /**
                     * For Pan's local bot use only
                     */
                    // Annie support server                    
                    for (const [serverId, commandObj] of commands.entries()) {
                        commandObj.forEach(item => {
                            formatDescriptions(item)
                        })

                        await rest.put(
                            Routes.applicationGuildCommands(`514688969355821077`, serverId), {
                            body:  CLEARCMD ? [] : commandObj
                        },
                        )
                    }
                } else if (process.env.NODE_DEV_CLIENT === `NAPH`) {
                    /**
                     * For Naph's local bot use only
                     */
                    for (const [serverId, commandObj] of commands.entries()) {
                        commandObj.forEach(item => {
                            formatDescriptions(item)
                        })
                        await rest.put(
                            Routes.applicationGuildCommands(`581546189925646350`, serverId), {
                            body:  CLEARCMD ? [] : commandObj
                        },
                        )
                    }
                }
            }
            logger.info(`[load guild] Successfully reloaded application guild (/) commands. ${commands.size} Servers`)
        } catch (error) {
            logger.error(error)
        }
    }


}
