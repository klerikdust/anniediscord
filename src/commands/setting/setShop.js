"use strict"
const Confirmator = require(`../../libs/confirmator`)
const stringSimilarity = require(`string-similarity`)
const ms = require(`ms`)
const fs = require(`fs`)
const superagent = require(`superagent`)
const {
    v4: uuidv4
} = require(`uuid`)
const findRole = require(`../../utils/findRole`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)

const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder
} = require(`discord.js`)

/**
 * Create, restock & sell items for your server members!
 * @author klerikdust
 */
module.exports = {
    name: `setshop`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`setshop`, `setshops`],
    description: `Create, restock & sell items for your server members!`,
    usage: `setShop`,
    permissionLevel: 3,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [{
        name: `open`,
        description: `Open the shop`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
    }, {
        name: `close`,
        description: `Close the shop`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
    }, {
        name: `text`,
        description: `Set the shop's text`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `Set the shop's text`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    }, {
        name: `image`,
        description: `Set the shop's image`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [{
            name: `attachment`,
            description: `Set the shop's image`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: `set`,
                description: `Set the shop's image`,
                name_localizations: {
                    fr: ``
                },
                description_localizations: {
                    fr: ``
                },
                required: true,
                type: ApplicationCommandOptionType.Attachment
            }]
        }, {
            name: `url`,
            description: `Set the shop's image`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: `set`,
                description: `Set the shop's image`,
                name_localizations: {
                    fr: ``
                },
                description_localizations: {
                    fr: ``
                },
                required: true,
                type: ApplicationCommandOptionType.String
            }]
        }, {
            name: `reset`,
            description: `Set the shop's image`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand
        }]
    }, {
        name: `delete`,
        description: `Delete an item`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `item`,
            description: `Delete an item`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    }, {
        name: `add`,
        description: `Add an item`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `item_name`,
            description: `Add an item`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String,
            max_length: 20
        }, {
            name: `item_price`,
            description: `Add an item`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.Integer
        }, {
            name: `item_description`,
            description: `Add an item`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String,
            max_length: 120
        }, {
            name: `tradeable`,
            description: `Add an item`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.Boolean
        }, {
            name: `item_use_message`,
            description: `{{user}} to mention a user & {{item}} to mention the item or type ~ to specify any custom message.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: false,
            type: ApplicationCommandOptionType.String,
            max_length: 120
        }]
    }, {
        name: `edit`,
        description: `Edit an item`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `item`,
            description: `Edit an item`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String,
            max_length: 20
        }]
    }],
    type: ApplicationCommandType.ChatInput,
    /**
     * An array of the available options for welcomer module
     * @type {array}
     */
    actions: [`open`, `close`, `text`, `image`, `add`, `delete`, `edit`],
    async execute(client, reply, message, arg, locale, prefix) {

        if (!arg) return await reply.send(locale.SETSHOP.GUIDE, {
            image: `banner_setshop`,
            header: `Hi, ${message.author.username}!`,
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`AnnieHeartPeek`)
            }
        })
        const args = arg.split(` `)
        //  Handle if the selected options doesn't exists
        if (!this.actions.includes(args[0].toLowerCase())) return await reply.send(locale.SETSHOP.INVALID_ACTION, {
            socket: {
                availableActions: this.actions.join(`, `)
            }
        })
        //  Run action
        return this[args[0].toLowerCase()](client, reply, message, arg, locale, prefix, args)
    },
    async Iexecute(client, reply, interaction, options, locale) {

        const checkPerm = reply.checkPermissions(interaction.channel)
        if (!checkPerm) return await reply.send(locale.ERROR_MISSING_PERMISSION)

        let args = null
        if (options.getSubcommand() === `open`) {
            args = [`open`]
        }
        if (options.getSubcommand() === `close`) {
            args = [`close`]
        }
        if (options.getSubcommand() === `text`) {
            args = [`text`, options.getString(`set`)]
        }
        if (options.getSubcommandGroup() === `image`) {
            if (options.getSubcommand() === `attachment`) {
                args = [`image`, options.getAttachment(`set`).url]
            } else if (options.getSubcommand() === `url`) {
                args = [`image`, options.getString(`set`)]
            } else if (options.getSubcommand() === `reset`) {
                args = [`imagereset`]
            }
        }
        if (options.getSubcommand() === `delete`) {
            args = [`delete`, options.getString(`item`)]
        }
        if (options.getSubcommand() === `add`) {
            args = [`addprefill`,
                options.getString(`item_name`),
                options.getInteger(`item_price`),
                options.getString(`item_description`),
                options.getBoolean(`tradeable`),
                options.getString(`item_use_message`) ? options.getString(`item_use_message`) : `~`
            ]
        }
        if (options.getSubcommand() === `edit`) {
            args = [`edit`, options.getString(`item`)]
        }
        //  Run action
        return this[args[0].toLowerCase()](client, reply, interaction, null, locale, `/`, args)
    },
    async addprefill(client, reply, interaction, arg, locale, prefix, args) {
        let buffs = []
        let metadata = {
            //  Common & custom type
            rarityId: 1,
            typeId: 13,
            ownedByGuildId: interaction.guild.id,
            usable: 1
        }
        const sessionId = `SHOP_REGISTER:${interaction.member.id}@${interaction.guild.id}`
        if (await client.db.databaseUtils.doesCacheExist(sessionId)) return await reply.send(locale.SETSHOP.ADD_SESSION_STILL_ACTIVE)
        client.db.databaseUtils.setCache(sessionId, `1`, { EX: 60 * 3 })
        //  Skip one phase ahead if user unintentionally added item name right after casting the 'add' action.

        let item_name = args[1]
        let item_price = args[2]
        let item_description = args[3]
        let tradeable = args[4] ? `y` : `n`
        let item_use_message = args[5]
        async function checkItemName(client, message, name) {
            const guildItems = await client.db.shop.getItem(null, message.guild.id)
            if (guildItems.filter(i => i.name.toLowerCase() === name.toLowerCase()).length > 0) {
                client.db.databaseUtils.delCache(sessionId)
                // client.db.redis.del(sessionId)
                await reply.send(locale.SETSHOP.ADD_NAME_DUPLICATE, {
                    socket: {
                        item: name
                    }
                })
                return false
            }
            return name
        }
        if (!await checkItemName(client, interaction, item_name)) return
        metadata.name = await checkItemName(client, interaction, item_name)
        metadata.description = item_description
        metadata.price = item_price
        metadata.tradeable = tradeable
        metadata.responseOnUse = item_use_message

        const stockButtonId = sessionId + `addprefillstockbutton`
        const cancelButtonId = sessionId + `addprefillbuffsbutton`
        const buffsButtonId = sessionId + `cancelitembutton`
        const finishedButtonId = sessionId + `finisheditembutton`
        const stockModalId = `shopaddpreefillstockmodal`
        const buffsModalId = `shopaddpreefillbuffs`
        let completed = false
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(stockButtonId)
                    .setLabel(`Stock`)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(buffsButtonId)
                    .setLabel(`Buffs?`)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(finishedButtonId)
                    .setLabel(`Finished`)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(cancelButtonId)
                    .setLabel(`Cancel`)
                    .setStyle(ButtonStyle.Danger)
            )
        let responseMessageContent = {
            instructions: `Please click the button of the value you would like to enter`,
            buffsoptions: `**Will it grants any bonus effect once used? (You can add up to 3 bonus effects per item)**\n♡ Once in the popup after hitting the \`buffs?\` button do one of the following\n♡ Type **\`addrole <roles>\`** to get specified roles once used.\n♡ Type **\`removerole <roles>\`** to remove specified roles from user once used.\n♡ Type **\`additem <amount> <itemName/itemId>\`** to receive specified items once used.\n♡ Type **\`removeitem <amount> <itemName/itemId>\`** to remove specified items from user's inventory.\n♡ Type **\`expboost <percentage> <duration>\`** To give exp boost to the user for specified amount of time.\n♡ Type **\`acboost <percentage> <duration>\`** to give artcoins boost to the user for specified amount of time.`,
            start: `\n╰☆～**Name ::** ${metadata.name}\n╰☆～**Description ::** ${metadata.description}\n╰☆～**Price ::** ${await client.getEmoji(`758720612087627787`)}${commanifier(metadata.price)} @pcs\n╰☆～**Can be traded ::** ${metadata.tradeable == `y` ? `yes` : `no`}\n╰☆～**My response after the item is used ::** ${metadata.responseOnUse === `~` ? `default` : metadata.responseOnUse}`,
        }

        let response = await reply.send(Object.values(responseMessageContent).slice(0, -1).join(`\n`) + Object.values(responseMessageContent).slice(-1), {
            fetchReply: true,
            footer: `Hitting finish before entering stock will defualt stock to unlimited, if not set already and buffs to no buffs added, if not set already.`,
            components: row
        })

        const member = interaction.user.id
        const messageComponentFilter = i => (i.customId === stockButtonId || i.customId === buffsButtonId || i.customId === cancelButtonId || i.customId === finishedButtonId) && i.user.id === member
        const buttonCollector = response.createMessageComponentCollector({ messageComponentFilter, time: 30000 })
        let buffOptions = []

        /**
         * Update message as choice are made
         * @returns {Promise}
         */
        async function joinFunction() {
            let finalizedResponseMessageContent = Object.values(responseMessageContent).join(`\n`)
            let message = await interaction.fetchReply()
            return await message.edit({
                embeds: [await reply.send(finalizedResponseMessageContent, { raw: true })]
            })
        }
        buttonCollector.on(`ignore`, async (i) => {
            i.reply({ content: `I'm sorry but only the user who sent this message may interact with it.`, ephemeral: true })
        })
        buttonCollector.on(`end`, async (collected, reason) => {
            client.db.databaseUtils.delCache(sessionId)
            // client.db.redis.del(sessionId)
            if (completed) return
            if (reason != `shop adding item has been cancelled` && reason != `time`) return
            const message = await interaction.fetchReply()
            try {
                message.edit({
                    content: `Shop register interface has been closed.`, components: [], embeds: []
                })
            } catch (error) {
                client.logger.error(`[setShop.js] ${error.stack}`)
            }
        })
        buttonCollector.on(`collect`, async i => {
            // Handle if user asked to cancel the quest
            if (i.customId === cancelButtonId) {
                i.deferUpdate()
                return buttonCollector.stop(`shop adding item has been cancelled`)
            }
            if (i.customId === finishedButtonId) {
                completed = true
                if (!Object.prototype.hasOwnProperty.call(metadata, `stocks`)) metadata[`stocks`] = 9223372036854775807n
                //  Register item
                await client.db.shop.registerItem(metadata)
                const item = await client.db.shop.getItem(metadata.name, interaction.guild.id)
                //  Register to the shop
                client.db.shop.registerGuildShopItem(item.item_id, metadata.ownedByGuildId, metadata.stocks, metadata.price)
                //  Register effect if there's any
                if (buffs.length > 0) buffs.map(b => client.db.shop.registerItemEffects(item.item_id, metadata.ownedByGuildId, b.type, b.params))
                const message = await interaction.fetchReply()
                message.edit({
                    embeds: [await reply.send(locale.SETSHOP.ADD_SUCCESSFUL, {
                        raw: true,
                        status: `success`,
                        socket: {
                            prefix: prefix,
                            emoji: await client.getEmoji(`789212493096026143`)
                        }
                    })],
                    components: []
                })

                return buttonCollector.stop()
            }
            const modalStock = new ModalBuilder()
                .setCustomId(stockModalId)
                .setTitle(`Stock`)
            const stockAnswerInput = new TextInputBuilder()
                .setCustomId(`stockAnswerInput`)
                // The label is the prompt the user sees for this input
                .setLabel(`**How many stocks will it be available?**`)
                // Short means only a single line of text
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setPlaceholder(`Type \`~\` for unlimited stocks.`)
            const modalBuffs = new ModalBuilder()
                .setCustomId(buffsModalId)
                .setTitle(`Stock`)
            const buffsAnswerInput = new TextInputBuilder()
                .setCustomId(`buffsAnswerInput`)
                // The label is the prompt the user sees for this input
                .setLabel(`What buff would you like to add`)
                // Short means only a single line of text
                .setStyle(TextInputStyle.Short)
                .setRequired(true)

            const stockActionRow = new ActionRowBuilder().addComponents(stockAnswerInput)
            modalStock.addComponents(stockActionRow)

            const buffsActionRow = new ActionRowBuilder().addComponents(buffsAnswerInput)
            modalBuffs.addComponents(buffsActionRow)

            buttonCollector.resetTimer({ time: 30000 })
            if (i.customId === stockButtonId) {
                await i.showModal(modalStock)
                const filter = (filter_interaction) => filter_interaction.customId === stockModalId && filter_interaction.user.id === interaction.member.user.id
                let rawAnswer
                try {
                    rawAnswer = await interaction.awaitModalSubmit({ filter, time: 30000 })
                } catch (error) {
                    client.logger.error(`Error has been handled\n${error}`)
                }
                if (!rawAnswer) return
                rawAnswer.deferUpdate()
                const input = rawAnswer.fields.getTextInputValue(`stockAnswerInput`).toLowerCase()
                if (!trueInt(input) && (input !== `~`)) return await reply.send(locale.SETSHOP.ADD_STOCK_INVALID, {
                    deleteIn: 5
                })
                metadata.stocks = input == `~` ? 9223372036854775807n : input
                responseMessageContent[`stock`] = `\n╰☆～**Stocks ::** ${input === `~` ? `unlimited` : commanifier(input)}`
                await joinFunction()
            } else if (i.customId === buffsButtonId) {
                if (buffOptions.length >= 3) return await reply.send(`Sorry no more buffs can be added`, {
                    deleteIn: 5
                })
                await i.showModal(modalBuffs)
                const filter = (filter_interaction) => filter_interaction.customId === buffsModalId && filter_interaction.user.id === interaction.member.user.id
                let rawAnswer
                try {
                    rawAnswer = await interaction.awaitModalSubmit({ filter, time: 30000 })
                } catch (error) {
                    client.logger.error(`Error has been handled\n${error}`)
                }
                if (!rawAnswer) return
                rawAnswer.deferUpdate()
                const answer = rawAnswer.fields.getTextInputValue(`buffsAnswerInput`).toLowerCase()
                const message = await i.fetchReply()
                const params = answer.split(` `)
                if (![`addrole`, `removerole`, `additem`, `removeitem`, `expboost`, `acboost`].includes(params[0])) return await reply.send(locale.SETSHOP.ADD_BUFF_OUT_OF_RANGE, {
                    deleteIn: 5
                })
                //  Role update buff
                const clientRole = interaction.guild.members.me.roles.highest
                if ([`addrole`, `removerole`].includes(params[0])) {
                    let res = []
                    let roleNames = ``
                    const roles = params.slice(1)
                    if (!roles.length) return await reply.send(locale.SETSHOP.ADD_BUFF_MISSING_ROLE, {
                        deleteIn: 5
                    })
                    for (let i = 0; i < roles.length; i++) {
                        const ref = roles[i]
                        const role = findRole(ref, message.guild)
                        if (!role) return await reply.send(locale.SETSHOP.ADD_BUFF_INVALID_ROLE, {
                            deleteIn: 5
                        })
                        if (role.position >= clientRole.position) return await reply.send(locale.SETSHOP.ADD_BUFF_TOO_HIGH_ROLE, {
                            deleteIn: 5
                        })
                        res.push(role.id)
                        roleNames += role.name + ((i + 1) >= roles.length ? ` ` : `, `)
                    }
                    const isRoleAddition = params[0] === `addrole`
                    buffs.push({
                        type: isRoleAddition ? 1 : 2,
                        params: res
                    })
                    buffOptions.push(`\n╰☆～**Bonus Effect ::** ${isRoleAddition ? `receiving` : `removed`} ${roleNames} roles`)
                    responseMessageContent[`buffs`] = buffOptions.join()
                    await joinFunction()
                }
                //  Inventory update buff
                if ([`additem`, `removeitem`].includes(params[0])) {
                    const amount = trueInt(params[1])
                    if (!amount) return await reply.send(locale.SETSHOP.ADD_BUFF_INVALID_ITEM_AMOUNT, {
                        deleteIn: 5
                    })
                    const targetItem = await client.db.shop.getItem(params.slice(2).join(` `))
                    if (!targetItem) return await reply.send(locale.SETSHOP.ADD_BUFF_INVALID_TARGET_ITEM, {
                        deleteIn: 5
                    })
                    const isItemAddition = params[0] === `additem`
                    buffs.push({
                        type: isItemAddition ? 3 : 4,
                        params: {
                            itemId: targetItem.item_id,
                            amount: amount
                        }
                    })
                    buffOptions.push(`\n╰☆～**Bonus Effect ::** ${isItemAddition ? `receiving` : `removed`} ${commanifier(amount)} pcs of '${targetItem.name}'`)
                    responseMessageContent[`buffs`] = buffOptions.join()
                    await joinFunction()
                }
                //  EXP/Artcoins boost buff
                if ([`expboost`, `acboost`].includes(params[0])) {
                    const multiplier = params[1].replace(/[^0-9a-z-A-Z ]/g, ``)
                    if (!multiplier) return await reply.send(locale.SETSHOP.ADD_BUFF_INVALID_MULTIPLIER, {
                        deleteIn: 5
                    })
                    const duration = ms(params.slice(2).join(` `))
                    if (!duration) return await reply.send(locale.SETSHOP.ADD_BUFF_INVALID_DURATION, {
                        deleteIn: 5
                    })
                    const isExpBuff = params[0] === `expboost`
                    buffs.push({
                        type: isExpBuff ? 5 : 6,
                        params: {
                            name: metadata.name,
                            multiplier: multiplier / 100,
                            duration: duration
                        }
                    })

                    buffOptions.push(`\n╰☆～**Bonus Effect ::** ${multiplier}% ${isExpBuff ? `EXP` : `Artcoins`} buff for ${ms(duration, { long: true })}`)
                    responseMessageContent[`buffs`] = buffOptions.join()
                    await joinFunction()
                }

            }
        })
    },

    /**
     * Enabling shop module
     * @return {void}
     */
    async open(client, reply, message, arg, locale, prefix) {
        const targetConfig = message.guild.configs.get(`SHOP_MODULE`)
        client.db.guildUtils.updateGuildConfiguration({
            configCode: `SHOP_MODULE`,
            customizedParameter: 1,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: message.guild.configs
        })
        return await reply.send(locale.SETSHOP.SUCCESSFULLY_ENABLED, {
            status: `success`,
            socket: {
                prefix: prefix
            }
        })
    },

    /**
     * Disabling welcomer module
     * @return {void}
     */
    async close(client, reply, message, arg, locale, prefix) {
        const targetConfig = message.guild.configs.get(`SHOP_MODULE`)
        client.db.guildUtils.updateGuildConfiguration({
            configCode: `SHOP_MODULE`,
            customizedParameter: 0,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: message.guild.configs
        })
        return await reply.send(locale.SETSHOP.SUCCESSFULLY_DISABLED)
    },

    /**
     * Set message to be attached in the shop.
     * @return {void}
     */
    async text(client, reply, message, arg, locale, prefix, args) {
        //  Handle if text content isn't provided
        const param = args.slice(1).join(` `)
        if (!param) return await reply.send(locale.SETSHOP.EMPTY_TEXT_PARAMETER, {
            socket: {
                prefix: prefix
            },
        })
        //  Update configs
        client.db.guildUtils.updateGuildConfiguration({
            configCode: `SHOP_TEXT`,
            customizedParameter: param,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: message.guild.configs
        })
        return await reply.send(locale.SETSHOP.TEXT_SUCCESSFULLY_REGISTERED, {
            status: `success`,
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    },

    /**
     * Adding item to shop
     * @return {void}
     */
    async add(client, reply, message, arg, locale, prefix, args) {
        let buffs = []
        let metadata = {
            //  Common & custom type
            rarityId: 1,
            typeId: 13,
            ownedByGuildId: message.guild.id,
            usable: 1
        }
        const sessionId = `SHOP_REGISTER:${message.author.id}@${message.guild.id}`

        if (await client.db.databaseUtils.doesCacheExist(sessionId)) return await reply.send(locale.SETSHOP.ADD_SESSION_STILL_ACTIVE)
        client.db.databaseUtils.setCache(sessionId, `1`, { EX: 60 * 3 })
        //  Skip one phase ahead if user unintentionally added item name right after casting the 'add' action.

        let phaseJump = false
        let dataDisplay = null
        if (args[1]) {
            const secondArg = args.slice(1).join(` `)
            phaseJump = true
            const nameLimit = 20
            if (secondArg.length >= nameLimit) {
                client.db.databaseUtils.delCache(sessionId)
                // client.db.redis.del(sessionId)
                return await reply.send(locale.SETSHOP.ADD_NAME_OVERLIMIT, {
                    socket: {
                        limit: nameLimit
                    }
                })
            }
            const guildItems = await client.db.shop.getItem(null, message.guild.id)
            if (guildItems.filter(i => i.name.toLowerCase() === secondArg.toLowerCase()).length > 0) {
                client.db.databaseUtils.delCache(sessionId)
                // client.db.redis.del(sessionId)
                return await reply.send(locale.SETSHOP.ADD_NAME_DUPLICATE, {
                    socket: {
                        item: secondArg
                    }
                })
            }
            metadata.name = secondArg

            dataDisplay = await message.channel.send({
                content: locale.SETSHOP.ADD_DESCRIPTION,
                embeds: [
                    await reply.send(`\n╰☆～**Name ::** ${secondArg}`, {
                        raw: true
                    })
                ]
            })

        } else {
            dataDisplay = await message.channel.send({
                content: locale.SETSHOP.ADD_NAME,
                embeds: [
                    await reply.send(locale.SETSHOP.ADD_NAME_FOOTER, {
                        raw: true
                    })
                ]
            })
        }
        const pool = message.channel.createMessageCollector({
            filter: m => m.author.id === message.author.id,
            time: 60000 * 3
        }) // 3 minutes timeout
        let phase = phaseJump ? 1 : 0
        let completed = false
        const joinFunction = async (newMessage) => {
            return await reply.send(dataDisplay.embeds[0].description + newMessage, {
                footer: `Type cancel to close this registration.`,
                raw: true
            })
        }
        pool.on(`collect`, async m => {
            let input = m.content.startsWith(prefix) ? m.content.slice(prefix.length) : m.content
            if (input === `cancel`) return pool.stop()
            m.delete()
            switch (phase) {
                //  Name
                case 0:
                    const nameLimit = 20
                    if (input.length >= nameLimit) return await reply.send(locale.SETSHOP.ADD_NAME_OVERLIMIT, {
                        deleteIn: 5,
                        socket: {
                            limit: nameLimit
                        }
                    })
                    const guildItems = await client.db.shop.getItem(null, message.guild.id)
                    if (guildItems.filter(i => i.name.toLowerCase() === input.toLowerCase()).length > 0) return await reply.send(locale.SETSHOP.ADD_NAME_DUPLICATE, {
                        deleteIn: 5,
                        socket: {
                            item: input
                        }
                    })
                    metadata.name = input
                    //  The reason why this line doesn't use joinFunction() is to omit the 'ADD_NAME_FOOTER' string from the embed.
                    dataDisplay.edit({
                        content: locale.SETSHOP.ADD_DESCRIPTION,
                        embeds: [await reply.send(`\n╰☆～**Name ::** ${input}`, {
                            raw: true
                        })]
                    })
                    phase++
                    break
                //  Description
                case 1:
                    const descLimit = 120
                    if (input.length >= descLimit) return await reply.send(locale.SETSHOP.ADD_DESCRIPTION_OVERLIMIT, {
                        deleteIn: 5,
                        socket: {
                            limit: descLimit
                        }
                    })
                    metadata.description = input
                    dataDisplay.edit({
                        content: locale.SETSHOP.ADD_PRICE,
                        embeds: [await joinFunction(`\n╰☆～**Description ::** ${input}`)]
                    })
                    phase++
                    break
                //  Price
                case 2:
                    if (!trueInt(input)) return await reply.send(locale.SETSHOP.ADD_PRICE_INVALID, {
                        deleteIn: 5
                    })
                    metadata.price = input
                    dataDisplay.edit({
                        content: locale.SETSHOP.ADD_STOCK,
                        embeds: [await joinFunction(`\n╰☆～**Price ::** ${await client.getEmoji(`758720612087627787`)}${commanifier(input)} @pcs`)]
                    })
                    phase++
                    break
                //  Stocks
                case 3:
                    if (!trueInt(input) && (input !== `~`)) return await reply.send(locale.SETSHOP.ADD_STOCK_INVALID, {
                        deleteIn: 5
                    })
                    metadata.stocks = input
                    dataDisplay.edit({
                        content: locale.SETSHOP.ADD_TRADABILITY,
                        embeds: [await joinFunction(`\n╰☆～**Stocks ::** ${input === `~` ? `unlimited` : commanifier(input)}`)]
                    })
                    phase++
                    break
                //  Tradability
                case 4:
                    if (!input.startsWith(`y`) && !input.startsWith(`n`)) return await reply.send(locale.SETSHOP.ADD_TRADABILITY_INVALID, {
                        deleteIn: 5
                    })
                    metadata.bind = input
                    dataDisplay.edit({
                        content: locale.SETSHOP.ADD_MESSAGE_UPON_USE,
                        embeds: [await joinFunction(`\n╰☆～**Can be traded ::** ${m.content.startsWith(`y`) ? `yes` : `no`}`)]
                    })
                    phase++
                    break
                //  Message upon use
                case 5:
                    const messageUponUseLimit = 120
                    if (input.length >= messageUponUseLimit) return await reply.send(locale.SETSHOP.ADD_MESSAGE_UPON_USE_OVERLIMIT, {
                        deleteIn: 5
                    })
                    metadata.responseOnUse = input
                    dataDisplay.edit({
                        content: locale.SETSHOP.ADD_BUFF,
                        embeds: [
                            await joinFunction(`\n╰☆～**My response after the item is used ::** ${input === `~` ? `default` : input}`)
                        ]
                    })
                    phase++
                    break
                //  Buffs upon use
                case 6:
                    if (input.startsWith(`done`)) {
                        phase = -1
                    } else {
                        const params = m.content.split(` `)
                        if (![`addrole`, `removerole`, `additem`, `removeitem`, `expboost`, `acboost`].includes(params[0])) return await reply.send(locale.SETSHOP.ADD_BUFF_OUT_OF_RANGE, {
                            deleteIn: 5
                        })
                        //  Role update buff
                        const clientRole = message.guild.me.roles.highest
                        if ([`addrole`, `removerole`].includes(params[0])) {
                            let res = []
                            let roleNames = ``
                            const roles = params.slice(1)
                            if (!roles.length) return await reply.send(locale.SETSHOP.ADD_BUFF_MISSING_ROLE, {
                                deleteIn: 5
                            })
                            for (let i = 0; i < roles.length; i++) {
                                const ref = roles[i]
                                const role = findRole(ref, message.guild)
                                if (!role) return await reply.send(locale.SETSHOP.ADD_BUFF_INVALID_ROLE, {
                                    deleteIn: 5
                                })
                                if (role.position >= clientRole.position) return await reply.send(locale.SETSHOP.ADD_BUFF_TOO_HIGH_ROLE, {
                                    deleteIn: 5
                                })
                                res.push(role.id)
                                roleNames += role.name + ((i + 1) >= roles.length ? ` ` : `, `)
                            }
                            const isRoleAddition = params[0] === `addrole`
                            buffs.push({
                                type: isRoleAddition ? 1 : 2,
                                params: res
                            })
                            await dataDisplay.edit({
                                content: locale.SETSHOP.ADD_BUFF,
                                embeds: [await joinFunction(`\n╰☆～**Bonus Effect ::** ${isRoleAddition ? `receiving` : `removed`} ${roleNames} roles`)]
                            })
                        }
                        //  Inventory update buff
                        if ([`additem`, `removeitem`].includes(params[0])) {
                            const amount = trueInt(params[1])
                            if (!amount) return await reply.send(locale.SETSHOP.ADD_BUFF_INVALID_ITEM_AMOUNT, {
                                deleteIn: 5
                            })
                            const targetItem = await client.db.shop.getItem(params.slice(2).join(` `))
                            if (!targetItem) return await reply.send(locale.SETSHOP.ADD_BUFF_INVALID_TARGET_ITEM, {
                                deleteIn: 5
                            })
                            const isItemAddition = params[0] === `additem`
                            buffs.push({
                                type: isItemAddition ? 3 : 4,
                                params: {
                                    itemId: targetItem.item_id,
                                    amount: amount
                                }
                            })
                            await dataDisplay.edit({
                                content: locale.SETSHOP.ADD_BUFF,
                                embeds: [await joinFunction(`\n╰☆～**Bonus Effect ::** ${isItemAddition ? `receiving` : `removed`} ${commanifier(amount)} pcs of '${targetItem.name}'`)]
                            })
                        }
                        //  EXP/Artcoins boost buff
                        if ([`expboost`, `acboost`].includes(params[0])) {
                            const multiplier = params[1].replace(/[^0-9a-z-A-Z ]/g, ``)
                            if (!multiplier) return await reply.send(locale.SETSHOP.ADD_BUFF_INVALID_MULTIPLIER, {
                                deleteIn: 5
                            })
                            const duration = ms(params.slice(2).join(` `))
                            if (!duration) return await reply.send(locale.SETSHOP.ADD_BUFF_INVALID_DURATION, {
                                deleteIn: 5
                            })
                            const isExpBuff = params[0] === `expboost`
                            buffs.push({
                                type: isExpBuff ? 5 : 6,
                                params: {
                                    name: metadata.name,
                                    multiplier: multiplier / 100,
                                    duration: duration
                                }
                            })
                            await dataDisplay.edit({
                                content: locale.SETSHOP.ADD_BUFF,
                                embeds: [await joinFunction(`\n╰☆～**Bonus Effect ::** ${multiplier}% ${isExpBuff ? `EXP` : `Artcoins`} buff for ${ms(duration, { long: true })}`)]
                            })
                        }
                        //  Limit allowed buffs per item
                        if (buffs.length >= 3) {
                            phase = -1
                        } else {
                            break
                        }
                    }

                //  Finalization
                case -1:
                    const confirmation = await reply.send(dataDisplay.embeds[0].description, {
                        header: locale.SETSHOP.ADD_CONFIRMATION,
                        thumbnail: message.author.displayAvatarURL()
                    })
                    dataDisplay.delete()
                    const c = new Confirmator(message, reply, locale)
                    await c.setup(m.author.id, confirmation)
                    c.onAccept(async () => {
                        completed = true
                        pool.stop()
                        //  Register item
                        await client.db.shop.registerItem(metadata)
                        const item = await client.db.shop.getItem(metadata.name, message.guild.id)
                        //  Register to the shop
                        client.db.shop.registerGuildShopItem(item.item_id, metadata.ownedByGuildId, metadata.stocks, metadata.price)
                        //  Register effect if there's any
                        if (buffs.length > 0) buffs.map(b => client.db.shop.registerItemEffects(item.item_id, metadata.ownedByGuildId, b.type, b.params))
                        return await reply.send(locale.SETSHOP.ADD_SUCCESSFUL, {
                            status: `success`,
                            socket: {
                                prefix: prefix,
                                emoji: await client.getEmoji(`789212493096026143`)
                            }
                        })
                    })
                default:
                    break
            }
        })
        pool.on(`end`, async () => {
            client.db.databaseUtils.delCache(sessionId)
            // client.db.redis.del(sessionId)
            if (completed) return
            dataDisplay.delete()
            await reply.send(`Shop register interface has been closed.`, {
                simplified: true
            })
        })
    },

    /**
     * Managing shop's image reset. 
     * @return {void}
     */
    async imagereset(client, reply, message, arg, locale, prefix, args) {
        const customBanner = message.guild.configs.get(`SHOP_IMAGE`).value
        if (!customBanner) return await reply.send(locale.SETSHOP.IMAGE_NOT_RESETABLE)
        const confirmation = await reply.send(locale.SETSHOP.CONFIRMATION_IMAGE, {
            image: `banner_setshop`,
            prebuffer: false
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            client.db.guildUtils.deleteGuildConfiguration(`SHOP_IMAGE`, message.guild.id)
            fs.unlink(`./src/assets/customShop/${customBanner}.png`, (error) => {
                if (error) client.logger.warn(`[setShop.js][Removing Image from filetree] ${error.stack}`)
            })
            await reply.send(locale.SETSHOP.IMAGE_SUCCESSFULLY_APPLIED, {
                status: `success`,
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
        })
    },

    /**
     * Managing shop's image. 
     * @return {void}
     */
    async image(client, reply, message, arg, locale, prefix, args) {
        const {
            isValidUpload,
            url
        } = this.getImage(message, args.slice(1).join(` `))
        if (!url) return await reply.send(locale.SETSHOP.IMAGE_MISSING_ATTACHMENT, {
            socket: {
                prefix: prefix
            }
        })
        if (!isValidUpload) return await reply.send(locale.SETSHOP.IMAGE_INVALID_UPLOAD, {
            socket: {
                emoji: await client.getEmoji(`692428969667985458`)
            }
        })
        const id = uuidv4()
        const response = await superagent.get(url)
        const buffer = response.body

        const confirmation = await reply.send(locale.SETSHOP.CONFIRMATION_IMAGE, {
            image: buffer,
            prebuffer: true
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            client.db.guildUtils.updateGuildConfiguration({
                configCode: `SHOP_IMAGE`,
                customizedParameter: id,
                guild: message.guild,
                setByUserId: message.member.id,
                cacheTo: message.guild.configs
            })
            await fs.writeFileSync(`./src/assets/customShop/${id}.png`, buffer)
            await reply.send(locale.SETSHOP.IMAGE_SUCCESSFULLY_APPLIED, {
                status: `success`,
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
        })
    },

    /** 
     * Check if user has attempted to upload a custom image
     * @param {Message} message Current message instance
     * @param {string} src Source keyword for parsing image url/attachment
     * @return {object}
     */
    getImage(message, src) {
        if (message.type !== 0) {
            const hasAttachment = src ? true : false
            const hasImageURL = src.startsWith(`http`) && src.length >= 15 ? true : false
            return {
                isValidUpload: hasAttachment || hasImageURL ? true : false,
                url: src.startsWith(`http`) && src.length >= 15 ?
                    src : null
            }
        }
        const hasAttachment = message.attachments.first() ? true : false
        const hasImageURL = src.startsWith(`http`) && src.length >= 15 ? true : false
        return {
            isValidUpload: hasAttachment || hasImageURL ? true : false,
            url: message.attachments.first() ?
                message.attachments.first().url : src.startsWith(`http`) && src.length >= 15 ?
                    src : null
        }
    },

    /**
     * Delete an item from shop and server.
     * @return {void}
     */
    async delete(client, reply, message, arg, locale, prefix, args) {
        const guildItems = await client.db.shop.getItem(null, message.guild.id)
        if (!guildItems.length) return await reply.send(locale.SETSHOP.DELETE_EMPTY_ITEMS)
        const keyword = args.slice(1).join(` `)
        if (!keyword) return await reply.send(locale.SETSHOP.DELETE_MISSING_TARGET, {
            socket: {
                emoji: await client.getEmoji(`AnnieHeartPeek`)
            }
        })
        //  Find best match
        const searchStringResult = stringSimilarity.findBestMatch(keyword, guildItems.map(i => i.name.toLowerCase()))
        const item = searchStringResult.bestMatch.rating >= 0.5
            //  By name
            ?
            guildItems.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target)
            //  Fallback search by ID
            :
            guildItems.find(i => parseInt(i.item_id) === parseInt(keyword))
        if (!item) return await reply.send(locale.SETSHOP.ITEM_DOESNT_EXISTS, {
            socket: {
                item: keyword
            }
        })
        const confirmation = await reply.send(locale.SETSHOP.DELETE_CONFIRMATION, {
            header: `Delete '${item.name}'?`,
            thumbnail: message.member.displayAvatarURL(),
            socket: {
                item: item.name
            }
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            client.db.shop.removeGuildShopItem(item.item_id)
            await reply.send(locale.SETSHOP.DELETE_SUCCESSFUL, {
                socket: {
                    item: item.name
                }
            })
        })
    },

    /**
     * Edit item's metadata.
     * @return {void}
     */
    async edit(client, reply, message, arg, locale, prefix, args) {
        const guildItems = await client.db.shop.getItem(null, message.guild.id)
        const isApplicationCommand = message.type != 2
        if (!guildItems.length) return await reply.send(locale.SETSHOP.DELETE_EMPTY_ITEMS)
        const keyword = args.slice(1).join(` `)
        if (!keyword) return await reply.send(locale.SETSHOP.DELETE_MISSING_TARGET, {
            socket: {
                emoji: await client.getEmoji(`AnnieHeartPeek`)
            }
        })
        //  Find best match
        const searchStringResult = stringSimilarity.findBestMatch(keyword, guildItems.map(i => i.name.toLowerCase()))
        const item = searchStringResult.bestMatch.rating >= 0.5
            //  By name
            ?
            guildItems.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target)
            //  Fallback search by ID
            :
            guildItems.find(i => parseInt(i.item_id) === parseInt(keyword))
        if (!item) return await reply.send(locale.SETSHOP.ITEM_DOESNT_EXISTS, {
            socket: {
                item: keyword
            }
        })

        let selectMenuOptions = [{
            "label": `Name`,
            "value": `name`,
            "description": `set the name of the item`,
            "emoji": undefined,
        }, {
            "label": `Description`,
            "value": `description`,
            "description": `set the decription of the item`,
            "emoji": undefined,
        }, {
            "label": `Price`,
            "value": `price`,
            "description": `set the price of the item`,
            "emoji": undefined,
        }, {
            "label": `Stock`,
            "value": `stock`,
            "description": `set the stock of the item`,
            "emoji": undefined,
        }, {
            "label": `Response`,
            "value": `response`,
            "description": `set the response the item will give when used`,
            "emoji": undefined,
        }]
        const selectMenuId = `setshopEditSelectMenu_${message.id}`
        const doneCancelButtonId = `setshopEditDoneCancelButton_${message.id}`

        const doneCancelButton = new ButtonBuilder().setCustomId(doneCancelButtonId).setLabel(`Done/Cancel`).setStyle(ButtonStyle.Secondary)
        let selectMenu = new StringSelectMenuBuilder()
            .setCustomId(selectMenuId)
            .setMinValues(1)
            .setMaxValues(1)
            .setOptions(selectMenuOptions)
        const selectMenuActionRow = new ActionRowBuilder().addComponents(selectMenu)
        const buttonActionRow = new ActionRowBuilder().addComponents(doneCancelButton)

        const guide = await reply.send(locale.SETSHOP.EDIT_GUIDE, {
            simplified: true,
            socket: {
                item: item.name,
                emoji: await client.getEmoji(`AnnieHeartPeek`),
                prefix: prefix
            },
            components: [selectMenuActionRow, buttonActionRow]
        })

        const member = isApplicationCommand ? message.author.id : message.user.id
        const filter = (i) => (i.customId === selectMenuId || i.customId === doneCancelButtonId) && i.user.id === member
        const editItemListenerTimer = 30000
        const editItemListener = guide.createMessageComponentCollector({
            filter,
            time: editItemListenerTimer
        })
        editItemListener.on(`ignore`, async (i) => {
            i.reply({ content: `I'm sorry but only the user who sent this message may interact with it.`, ephemeral: true })
        })
        editItemListener.on(`end`, async (collected, reason) => {
            const msg = await guide.fetch()
            try {
                msg.edit({
                    content: `Shop editor interface has been closed.`, components: [], embeds: []
                })
            } catch (error) {
                client.logger.error(`[setShop.js] ${error.stack}`)
            }
        })
        editItemListener.on(`collect`, async (i) => {
            if (i.customId === doneCancelButtonId) {
                return editItemListener.stop()
            }
            editItemListener.resetTimer(editItemListenerTimer)
            let selection = i.values[0]
            const modalEditId = `${selection}_${i.id}`
            const modalEdit = new ModalBuilder().setCustomId(modalEditId).setTitle(`You are editing the item's ${selection}`)
            guide.edit({ components: [selectMenuActionRow, buttonActionRow] })
            switch (selection) {
                case `name`:
                    const nameAnswerInput = new TextInputBuilder()
                        .setCustomId(`answerInput`)
                        // The label is the prompt the user sees for this input
                        .setLabel(`**What is the new name?**`)
                        // Short means only a single line of text
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMinLength(1)
                        .setMaxLength(20)
                    const nameActionRow = new ActionRowBuilder().addComponents(nameAnswerInput)
                    modalEdit.addComponents(nameActionRow)
                    name(modalEdit, i)
                    break
                case `description`:
                    const descriptionAnswerInput = new TextInputBuilder()
                        .setCustomId(`answerInput`)
                        // The label is the prompt the user sees for this input
                        .setLabel(`**What is the new description?**`)
                        // Short means only a single line of text
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMinLength(1)
                        .setMaxLength(120)
                    const descriptionActionRow = new ActionRowBuilder().addComponents(descriptionAnswerInput)
                    modalEdit.addComponents(descriptionActionRow)
                    description(modalEdit, i)
                    break
                case `price`:
                    const priceAnswerInput = new TextInputBuilder()
                        .setCustomId(`answerInput`)
                        // The label is the prompt the user sees for this input
                        .setLabel(`**What is the new price?**`)
                        // Short means only a single line of text
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMinLength(1)
                        .setMaxLength(15)
                    const priceActionRow = new ActionRowBuilder().addComponents(priceAnswerInput)
                    modalEdit.addComponents(priceActionRow)
                    price(modalEdit, i)
                    break
                case `stock`:
                    const stockAnswerInput = new TextInputBuilder()
                        .setCustomId(`answerInput`)
                        // The label is the prompt the user sees for this input
                        .setLabel(`**What is the new amount of stock?**`)
                        // Short means only a single line of text
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMinLength(1)
                        .setMaxLength(15)
                    const stockActionRow = new ActionRowBuilder().addComponents(stockAnswerInput)
                    modalEdit.addComponents(stockActionRow)
                    stock(modalEdit, i)
                    break
                case `response`:
                    const responseAnswerInput = new TextInputBuilder()
                        .setCustomId(`answerInput`)
                        // The label is the prompt the user sees for this input
                        .setLabel(`**What is the new response?**`)
                        // Short means only a single line of text
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMinLength(1)
                        .setMaxLength(120)
                    const responseActionRow = new ActionRowBuilder().addComponents(responseAnswerInput)
                    modalEdit.addComponents(responseActionRow)
                    response(modalEdit, i)
                    break
                default:
                    break
            }
        })
        async function getModalResponse(modal, i) {
            const filter = (interaction) => interaction.customId === modal.data.custom_id
            let rawAnswer
            try {
                rawAnswer = await i.awaitModalSubmit({ filter, time: 30000 })
            } catch (error) {
                client.logger.error(`Error has been handled\n${error}`)
            }
            if (!rawAnswer) return false
            rawAnswer.deferUpdate()
            return rawAnswer
        }
        async function name(modal, interaction) {
            interaction.showModal(modal)
            const rawAnswer = await getModalResponse(modal, interaction)
            if (!rawAnswer) return
            const params = rawAnswer.fields.getTextInputValue(`answerInput`)
            const nameLimit = 20
            if (params.length >= nameLimit) return await reply.send(locale.SETSHOP.ADD_NAME_OVERLIMIT, {
                deleteIn: 5,
                socket: {
                    limit: nameLimit
                }
            })
            if (guildItems.filter(i => i.name.toLowerCase() === params.toLowerCase()).length > 0) return await reply.send(locale.SETSHOP.ADD_NAME_DUPLICATE, {
                deleteIn: 5,
                socket: {
                    item: params
                }
            })
            client.db.shop.updateItemMetadata(item.item_id, `name`, params)
            await reply.send(locale.SETSHOP.EDIT_NAME_SUCCESSFUL, {
                socket: {
                    oldItem: item.name,
                    newItem: params
                }
            })
        }

        async function description(modal, interaction) {
            interaction.showModal(modal)
            const rawAnswer = await getModalResponse(modal, interaction)
            if (!rawAnswer) return
            const params = rawAnswer.fields.getTextInputValue(`answerInput`)
            const descLimit = 120
            if (params.length >= descLimit) return await reply.send(locale.SETSHOP.ADD_DESCRIPTION_OVERLIMIT, {
                deleteIn: 5,
                socket: {
                    limit: descLimit
                }
            })
            client.db.shop.updateItemMetadata(item.item_id, `description`, params)
            await reply.send(locale.SETSHOP.EDIT_DESC_SUCCESSFUL, {
                socket: {
                    item: item.name
                }
            })
        }

        async function price(modal, interaction) {
            interaction.showModal(modal)
            const rawAnswer = await getModalResponse(modal, interaction)
            if (!rawAnswer) return
            const params = rawAnswer.fields.getTextInputValue(`answerInput`)
            const priceLimit = 999999999999999
            if (parseInt(params) >= priceLimit) return await reply.send(locale.SETSHOP.EDIT_PRICE_OVERLIMIT, {
                deleteIn: 5,
                socket: {
                    limit: commanifier(priceLimit)
                }
            })
            if (!trueInt(params)) return await reply.send(locale.SETSHOP.EDIT_PRICE_INVALID, {
                deleteIn: 5
            })
            client.db.shop.updateShopItemMetadata(item.item_id, `price`, parseInt(params))
            await reply.send(locale.SETSHOP.EDIT_PRICE_SUCCESSFUL, {
                socket: {
                    item: item.name
                }
            })
        }

        async function stock(modal, interaction) {
            interaction.showModal(modal)
            const rawAnswer = await getModalResponse(modal, interaction)
            if (!rawAnswer) return
            const params = rawAnswer.fields.getTextInputValue(`answerInput`)
            const amount = params == `~` ? 9223372036854775807n : params
            const stockLimit = 999999999999999
            const setAsUnlimited = params === `~`
            if (!setAsUnlimited) {
                if (parseInt(params) >= stockLimit) return await reply.send(locale.SETSHOP.EDIT_STOCK_OVERLIMIT, {
                    deleteIn: 5,
                    socket: {
                        limit: commanifier(stockLimit)
                    }
                })
                if (!trueInt(params)) return await reply.send(locale.SETSHOP.EDIT_PRICE_INVALID, {
                    deleteIn: 5
                })
            }
            client.db.shop.updateShopItemMetadata(item.item_id, `quantity`, amount)
            await reply.send(locale.SETSHOP.EDIT_STOCK_SUCCESSFUL, {
                socket: {
                    item: item.name
                }
            })
        }

        async function response(modal, interaction) {
            interaction.showModal(modal)
            const rawAnswer = await getModalResponse(modal, interaction)
            if (!rawAnswer) return
            const params = rawAnswer.fields.getTextInputValue(`answerInput`)
            const messageUponUseLimit = 120
            if (params.length >= messageUponUseLimit) return await reply.send(locale.SETSHOP.EDIT_MSGUPONUSE_OVERLIMIT, {
                deleteIn: 5,
                socket: {
                    limit: messageUponUseLimit
                }
            })
            client.db.shop.updateItemMetadata(item.item_id, `response_on_use`, params)
            await reply.send(locale.SETSHOP.EDIT_MSGUPONUSE_SUCCESSFUL, {
                socket: {
                    item: item.name
                }
            })
        }
    },

    /**
     * Parse sockets (if available) in the guild's welcomer text.
     * @param {Message} message Current message instance
     * @private
     * @returns {string}
     */
    _parseText(message) {
        let text = this.guildConfigurations.get(`WELCOMER_TEXT`).value
        text = text.replace(/{{guild}}/gi, `**${message.guild.name}**`)
        text = text.replace(/{{user}}/gi, message.member)
        return text
    }
}