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

    function formatNames(command) {
        /**
         * Recursively go thru and format descriptions.
         * @param {Object} command 
         */
        function recursiveFormatName(command) {
            /**
             * format and return the string
             * @param {string} string 
             * @returns {string}
             */
            function format(string) {
                return string != string.toLowerCase() ? string.toLowerCase() : string
            }

            for (var e in command) {
                if (e === `name_localizations`) {
                    for (var l in command[e]) {
                        command[e][l] = command[e][l] === `` ? command.name : command[e][l]
                        command[e][l] = format(command[e]?.[l])
                    }
                } else if (e === `options`) {
                    recursiveFormatName(command?.[e])
                } else { continue }
            }
        }
        return recursiveFormatName(command)
    }



    function formatDescriptions(command) {
        if (command.type === 3) return command.description = null
        /**
         * Recursively go thru and format descriptions.
         * @param {Object} command 
         */
        function recursiveFormatDesc(command) {
            /**
             * format and return the string
             * @param {string} string 
             * @returns {string}
             */
            function format(string) {
                return string.length >= 100 ? `${string.substring(0, 90)}...` : string
            }
            for (var e in command) {
                if (e === `description_localizations`) {
                    for (var l in command[e]) {
                        command[e][l] = command[e][l] === `` ? command.description : command[e][l]
                        command[e][l] = format(command[e][l])
                    }
                } else if (e === `description`) {
                    command.description = format(command.description)
                } else if (e === `options`) {
                    recursiveFormatDesc(command?.[e])
                } else { continue }
            }
        }
        return recursiveFormatDesc(command)
        // return command.description.length >= 100 ? command.description = `${command.description.substring(0, 90)}...` : command.description
    }

    if (guildOnly) {
        return (async () => await loadGuildOnly())()
    } else {
        return (async () => await load())()
    }

    async function load() {
        commands.forEach(item => {
            formatDescriptions(item)
            formatNames(item)
        })

        try {
            logger.info(`[load] Started refreshing application (/) commands.`)
            if (process.env.NODE_ENV === `production` || process.env.NODE_ENV === `production_beta`) {
                await rest.put(
                    Routes.applicationCommands(NODE_ENVIRONMENT_CLIENT_ID), {
                    body: commands
                },
                )
            } else {
                const BOTID = process.env.NODE_DEV_ID
                if (process.env.NODE_DEV_CLIENT === `PAN`) {
                    /**
                     * For Pan's local bot use only
                     */
                    // test botv1: 514688969355821077
                    // test botv2: 1254197982132310167
                    // Annie support server
                    await rest.put(
                        Routes.applicationCommands(BOTID), {
                        body: commands
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
                const BOTID = process.env.NODE_DEV_ID
                if (process.env.NODE_DEV_CLIENT === `PAN`) {
                    /**
                     * For Pan's local bot use only
                     */
                    // test botv1: 514688969355821077
                    // test botv2: 1254197982132310167
                    // Annie support server        
                    const allowedServersForDev = [`577121315480272908`, `597171669550759936`] // [Annie support server, Pan's test server]
                    for (const [serverId, commandObj] of commands.entries()) {
                        commandObj.forEach(item => {
                            formatDescriptions(item)
                        })
                        if (allowedServersForDev.includes(serverId)) {
                            await rest.put(
                                Routes.applicationGuildCommands(BOTID, serverId), {
                                body: CLEARCMD ? [] : commandObj
                            },
                            )
                        }
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
                            body: CLEARCMD ? [] : commandObj
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
