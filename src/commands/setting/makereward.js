"use strict"
const customReward = require(`../../libs/customRewards`)
const stringSimilarity = require(`string-similarity`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    Collection,
    ActionRowBuilder,
    ComponentType,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits
} = require(`discord.js`)

/**
 * Output bot's latency
 * @author Fryingpan
 */
module.exports = {
    name: `makereward`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`mr`],
    description: `make a custom reward package`,
    usage: `makereward`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: false,
    server_specific: false,
    default_member_permissions: PermissionFlagsBits.ManageEvents.toString(),
    options: [{
        name: `create`,
        description: `make a new reward package`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `package_name`,
            description: `What to call the reward package`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String
        }, {
            name: `ac`,
            description: `how much ac to give as reward`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: false,
            type: ApplicationCommandOptionType.Integer,
            min_value: 0,
            max_value: 10000
        }, {
            name: `roles`,
            description: `how many roles do you want to give`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: false,
            type: ApplicationCommandOptionType.Integer,
            min_value: 0,
            max_value: 5
        }, {
            name: `items`,
            description: `how many roles do you want to give`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: false,
            type: ApplicationCommandOptionType.Integer,
            min_value: 0,
            max_value: 5
        }]
    }, {
        name: `delete`,
        description: `delete a package`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `package_name`,
            description: `the name of the package name`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        }]
    }, {
        name: `list`,
        description: `delete a package`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }],
    type: ApplicationCommandType.ChatInput,
    async Iexecute(client, reply, interaction, options, locale) {
        // Test if the delete sub command was executed
        if (options.getSubcommand() === `delete`) return this.deletePackage(client, reply, interaction, options, locale)

        // Test if the list sub command was executed
        if (options.getSubcommand() === `list`) return this.listPackages(client, reply, interaction, options, locale)

        // Test if any other parameter was entered and if it wasn't exit the commands and let the user know
        if (!options.getInteger(`roles`) && !options.getInteger(`items`) && !options.getInteger(`ac`)) return await reply.send(`Sorry must pick one of the other options`)

        // Set the name for the package
        const packageName = (options.getString(`package_name`)).toLowerCase()

        // Get all currently available packages for the guild to test against, so there are none with duplicate names.
        const packages = await client.db.customRewardUtils.getCustomRewards(interaction.guild.id)
        if (packages.length >= 25) return await reply.send(`I'm sorry but you have reached the max amount of packages. Please delete one if you wish to make another one.`)

        const packages_collection = new Collection()

        const rewardSchema = new customReward(packageName)
        packages.forEach(element => {
            packages_collection.set(element.reward_name, rewardSchema.unpack(element.reward))
        })
        if (packages_collection.has(packageName)) return await reply.send(`I'm sorry but you have a package with that name already`)

        // Set up varibles to hold the values we want to add to the schema
        let roles = []
        let items = []
        let acAmount = 0

        // Set up varibles to control the flow of input
        let roleAmount = 0
        let itemAmount = 0
        let phase = 0
        let endPhase = 0

        // This varible is to keep track of messages that the user will see
        // Needs to be empty so we can add values only when we want them to show
        let trackingMessageContent = {
            start: `The package you are creating is named ${packageName}`
        }

        // Create the cooldown for the command so a user cant start two instances of the command
        const sessionID = `REWARD_REGISTER:${interaction.member.id}@${interaction.guild.id}`
        if (await client.db.databaseUtils.doesCacheExist(sessionID)) return await reply.send({ content: `I'm sorry but you have a create package session still active please wait a few before trying again`, ephemeral: true })
        client.db.databaseUtils.setCache(sessionID, `1`, { EX: 60 * 3 })

        // Set up and send the message that will be updated as choices are made.
        let trackingMessage = await reply.send(Object.values(trackingMessageContent).join(`\n`), {
            simplified: true
        })

        // Check if the input for amount of ac was given and if yes set the amount and update the tracking message
        if (options.getInteger(`ac`)) {
            acAmount = options.getInteger(`ac`)
            // trackingMessageContent[`ac`] = `AC amount set to ${acAmount}`
            updateTrackerMessage(`ac`, `AC amount set to ${acAmount}`)
            // Check that no other options were inputed and send to completion method
            if (!options.getInteger(`roles`) && !options.getInteger(`items`)) return confirmOrCancel()
        }

        // Test if the option for amount of roles was entered otherwise test if the option for amount of items was entered
        if (options.getInteger(`roles`)) {
            roleAmount = options.getInteger(`roles`) // how many roles maximum should there be
            // trackingMessageContent[`roles`] = `(0/${roleAmount}) roles selected`
            updateTrackerMessage(`roles`, `(0/${roleAmount}) roles selected`)
            if (options.getInteger(`items`)) {
                endPhase = 1
                itemAmount = options.getInteger(`items`)
                // trackingMessageContent[`items`] = `(0/${itemAmount}) items selected`
                updateTrackerMessage(`items`, `(0/${itemAmount}) items selected`)
            }
            phaseOne()
        } else if (options.getInteger(`items`)) {
            phase = 1 // Set the starting phase to skip the role method.
            endPhase = 1
            itemAmount = options.getInteger(`items`) // how many items maximum should there be
            // trackingMessageContent[`items`] = `(0/${itemAmount}) items selected`
            updateTrackerMessage(`items`, `(0/${itemAmount}) items selected`)
            phaseTwo()
        }

        async function phaseOne() {
            const roleOptions = await setRoleOptions(interaction) // get available roles to select from
            // End phase if there are no roles available
            if (!roleOptions.size || roleOptions.size === 0) {
                // trackingMessageContent[`roles`] = `(0/0) roles selected, There are no roles available to add`
                roles = []
                updateTrackerMessage(`roles`, `(0/0) roles selected, There are no roles available to add`)
                await await reply.send(`Sorry you dont have any roles for me to give try moving my role higher.`, { ephemeral: true })
                phase++
                // Test to see if we need to go to item select, if not go to the confirmation method
                if (endPhase === phase) return phaseTwo()
                // trackingMessageContent[`footer`] = `Please hit the button to confirm the transaction or cancel to stop the transaction`
                updateTrackerMessage(`footer`, `Please hit the button to confirm the transaction or cancel to stop the transaction`)
                return confirmOrCancel()
            }

            const roleButtonCustomId = `${sessionID}_role_${interaction.id}`
            const cancelButtonCustomId = `${sessionID}_cancel_${interaction.id}`
            const finishedButtonCustomId = `${sessionID}_finished_${interaction.id}`
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(roleButtonCustomId)
                        .setLabel(`Role`)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(finishedButtonCustomId)
                        .setLabel(`Finished`)
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(cancelButtonCustomId)
                        .setLabel(`Cancel`)
                        .setStyle(ButtonStyle.Danger)
                )
            const role_adding = await reply.send(`Time to add any roles if you wish.`, { components: row })
            const member = interaction.user.id
            const filter = interaction => [roleButtonCustomId, cancelButtonCustomId, finishedButtonCustomId].some(id => id === interaction.customId) && interaction.user.id === member
            // const filter = interaction => (interaction.customId === roleButtonCustomId || interaction.customId === cancelButtonCustomId || interaction.customId === finishedButtonCustomId) && interaction.user.id === member
            const buttonCollector = role_adding.createMessageComponentCollector({ filter, time: 30000 })

            // Send a message to the users if they try to use the command when they didn't iniate it
            buttonCollector.on(`ignore`, async (i) => {
                i.reply({ content: `I'm sorry but only the user who sent this message may interact with it.`, ephemeral: true })
            })

            // What to do when the collector times out or gets called by .stop()
            buttonCollector.on(`end`, async (collected, reason) => {
                if (reason != `time`) return confirmOrCancel()
                const message = await interaction.fetchReply()
                try {
                    message.edit({ components: [] })
                    role_adding.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                    client.db.databaseUtils.delCache(sessionID)
                    // client.db.redis.del(sessionID)
                    await reply.send(`Your time has expired, no worries though just excute the makereward command again to add a package`, { ephemeral: true })
                } catch (error) {
                    client.logger.error(`[makereward.js]\n${error}`)
                }
            })


            buttonCollector.on(`collect`, async i => {
                if (i.customId === cancelButtonCustomId) {
                    // trackingMessageContent[`footer`] = `No roles have been added`
                    updateTrackerMessage(`footer`, `No roles have been added`)
                    roles = []
                    role_adding.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                    return buttonCollector.stop()
                }

                if (i.customId === finishedButtonCustomId) {
                    return buttonCollector.stop()
                }

                const finializedSelection = []
                const modalId = `${sessionID}_${i.id}_${interaction.member.id}`
                const modal = new ModalBuilder()
                    .setCustomId(modalId)
                    .setTitle(`Role creation`)
                const roleInput = new TextInputBuilder()
                    .setCustomId(`roleInput`)
                    // The label is the prompt the user sees for this input
                    .setLabel(`What is the role's name or id?`)
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                // Have to add to a action row to add component to the modal
                const firstActionRow = new ActionRowBuilder().addComponents(roleInput)
                modal.addComponents(firstActionRow)

                // reset the timer for the listener so the user has more time
                buttonCollector.resetTimer({ time: 30000 })

                await i.showModal(modal)
                const filter = (interaction) => interaction.customId === modalId && interaction.member.id === member

                // Create local vars; these will be updated later with values
                let rawAnswer
                let roleTry = 1
                try {
                    rawAnswer = await interaction.awaitModalSubmit({ filter, time: 30000 })
                } catch (error) {
                    client.logger.error(`Error has been handled\n${error}`)
                }

                // ignore if the modal wasn't submited
                if (!rawAnswer) return
                rawAnswer.deferUpdate()

                const answerRole = rawAnswer.fields.getTextInputValue(`roleInput`).toLowerCase()

                //  Find best match
                let roleID = answerRole
                let has_role = roleOptions.has(answerRole)
                if (!has_role) {
                    for (const [key, value] of roleOptions) {
                        if (value.name.toLowerCase() === answerRole) {
                            has_role = true
                            roleID = key
                            break
                        }
                    }
                }
                if (!has_role) {
                    roleTry++
                    // trackingMessageContent[`footer`] = `No role was found, try again please. After the third try it will automatically set to your current roles made or set to zero roles. This is your ${roleTry} attempt.`
                    updateTrackerMessage(`footer`, `No role was found, try again please. After the third try it will automatically set to your current roles made or set to zero roles. This is your ${roleTry} attempt.`)
                    if (roleTry > 3) {
                        // trackingMessageContent[`items`] = `(${finializedSelection.length}/${roleAmount}) items selected ${formatSelectedItem(items)}`
                        updateTrackerMessage(`items`, `(${finializedSelection.length}/${roleAmount}) items selected ${formatSelectedItem(items)}`)
                        buttonCollector.stop()
                    }
                } else {
                    // The role has been confirmed and now can continue

                    let role = roleOptions.get(roleID)
                    // Confirm the item and then assign the quantity
                    const roleConfirmationRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`confirm`)
                                .setLabel(`Yes thats it`)
                                .setStyle(ButtonStyle.Success),
                        )
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancel`)
                                .setLabel(`No thats not the role`)
                                .setStyle(ButtonStyle.Danger)
                        )
                    const confirmationRole = await reply.send(`The role i found was: ${role.name}, is this correct`, {
                        components: [roleConfirmationRow]
                    })
                    const rolefilter = roleInteraction => [`confirm`, `cancel`].some(id => id === roleInteraction.customId) && roleInteraction.user.id === member
                    const roleListener = confirmationRole.createMessageComponentCollector({
                        rolefilter,
                        componentType: ComponentType.Button,
                        time: 60 * 1000
                    })

                    roleListener.on(`collect`, async button => {
                        function rolesHitMax() {
                            roles = finializedSelection
                            role_adding.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                            roleListener.stop()
                            return buttonCollector.stop()
                        }

                        await button.deferUpdate()
                        await confirmationRole.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                        if (button.customId === `confirm`) {
                            if (finializedSelection.length === roleAmount) return rolesHitMax() // Check before to avoid possibly duplicating record
                            finializedSelection.push(role.id)
                            // trackingMessageContent[`roles`] = `(${finializedSelection.length}/${roleAmount}) roles selected ${formatSelectedRoles(roleOptions)}`
                            updateTrackerMessage(`roles`, `(${finializedSelection.length}/${roleAmount}) roles selected ${formatSelectedRoles(roleOptions)}`)
                            if (finializedSelection.length === roleAmount) return rolesHitMax() // Check again to end the phase
                        } else {
                            // trackingMessageContent[`footer`] = `Please Hit the role button to try again`
                            updateTrackerMessage(`footer`, `Please Hit the role button to try again`)
                        }
                    })

                    // Send a message to the users if they try to use the command when they didn't iniate it
                    roleListener.on(`ignore`, async (i) => {
                        i.reply({ content: `I'm sorry but only the user who sent this message may interact with it.`, ephemeral: true })
                    })

                    // What to do when the collector for the role confirmation ends.
                    roleListener.on(`end`, async () => {
                        return confirmationRole.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))

                        // // Clear any components left on the message.
                        // await confirmationRole.edit({
                        //     components: []
                        // })

                        // // Increase the phase and then test to see if it need to continue on or go to the confirmation method.
                        // phase++
                        // if (endPhase === phase) return phaseTwo()
                        // // trackingMessageContent[`footer`] = `Please hit the button to confirm the transaction or cancel to stop the transaction`
                        // updateTrackerMessage(`footer`, `Please hit the button to confirm the transaction or cancel to stop the transaction`)
                        // return confirmOrCancel()
                    })

                }
            })
        }

        /**
         * Allow the user to find an item and then go to confirming the package.
         */
        async function phaseTwo() {
            // Setup the local values that will be updated later
            let itemTry = 1

            // Setup the constant values that wont be changed then test to make sure that there are items available and if not, end the phase and move to the confirmation method.
            const itemNames = []
            const availableItems = await client.db.shop.getItem(null, interaction.guild.id)
            // End phase if there are no items available
            if (!availableItems.length) {
                items = []
                // trackingMessageContent[`items`] = `(0/0) items selected, There are no items available to add`
                updateTrackerMessage(`items`, `(0/0) items selected, There are no items available to add`)
                return await reply.send(`Sorry you dont have any items for me to give try adding one with /setshop add.`, { ephemeral: true })
            }

            // Create the buttons and collector for adding an item
            const itemButtonCustomId = `${sessionID}_item_${interaction.id}`
            const cancelButtonCustomId = `${sessionID}_cancel_${interaction.id}`
            const finishedButtonCustomId = `${sessionID}_finished_${interaction.id}`

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(itemButtonCustomId)
                        .setLabel(`Item`)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(finishedButtonCustomId)
                        .setLabel(`Finished`)
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(cancelButtonCustomId)
                        .setLabel(`Cancel`)
                        .setStyle(ButtonStyle.Danger)
                )
            const item_adding = await reply.send(`Time to add any items if you wish.`, { components: row })
            const member = interaction.user.id
            const filter = interaction => [itemButtonCustomId, cancelButtonCustomId, finishedButtonCustomId].some(id => id === interaction.customId) && interaction.user.id === member
            // const filter = interaction => (interaction.customId === buttonCustomId || interaction.customId === `cancel` || interaction.customId === `finished`) && interaction.user.id === member
            const buttonCollector = item_adding.createMessageComponentCollector({ filter, time: 30000 })

            // Send a message to the users if they try to use the command when they didn't iniate it
            buttonCollector.on(`ignore`, async (i) => {
                i.reply({ content: `I'm sorry but only the user who sent this message may interact with it.`, ephemeral: true })
            })

            // What to do when the collector for adding an item ends
            buttonCollector.on(`end`, async (collected, reason) => {
                if (reason != `time`) return confirmOrCancel()
                const message = await interaction.fetchReply()
                try {
                    message.edit({ components: [] })
                    item_adding.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                    client.db.databaseUtils.delCache(sessionID)
                    // client.db.redis.del(sessionID)
                    await reply.send(`Your time has expired, no worries though just excute the makereward command again to add a package`, { ephemeral: true })
                } catch (error) {
                    client.logger.error(`[makereward.js]\n${error}`)
                }
            })


            buttonCollector.on(`collect`, async i => {
                if (i.customId === cancelButtonCustomId) {
                    updateTrackerMessage(`footer`, `No items have been added`)
                    items = []
                    item_adding.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                    return buttonCollector.stop()
                }
                if (i.customId === finishedButtonCustomId) {
                    return buttonCollector.stop()
                }
                const modalId = `${sessionID}_${i.id}_${interaction.member.id}`
                const modal = new ModalBuilder()
                    .setCustomId(modalId)
                    .setTitle(`Item creation`)
                const itemNameInput = new TextInputBuilder()
                    .setCustomId(`itemNameInput`)
                    // The label is the prompt the user sees for this input
                    .setLabel(`What is the item's name?`)
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                const itemQuantityInput = new TextInputBuilder()
                    .setCustomId(`itemQuantityInput`)
                    // The label is the prompt the user sees for this input
                    .setLabel(`What quantity should be given?`)
                    // Short means only a single line of text
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                // Add to action rows before adding to modal
                const firstActionRow = new ActionRowBuilder().addComponents(itemNameInput)
                modal.addComponents(firstActionRow)
                const secondActionRow = new ActionRowBuilder().addComponents(itemQuantityInput)
                modal.addComponents(secondActionRow)

                // reset the timer for the listener so the user has more time
                buttonCollector.resetTimer({ time: 30000 })

                await i.showModal(modal)
                const filter = (interaction) => interaction.customId === modalId && interaction.member.id === member
                let rawAnswer
                try {
                    rawAnswer = await interaction.awaitModalSubmit({ filter, time: 30000 })
                } catch (error) {
                    client.logger.error(`Error has been handled\n${error}`)
                }

                // ignore if the modal wasn't submited
                if (!rawAnswer) return
                rawAnswer.deferUpdate()

                // Grab the user inputs from the modal once submited.
                const answerName = rawAnswer.fields.getTextInputValue(`itemNameInput`).toLowerCase()
                const answerQuantity = rawAnswer.fields.getTextInputValue(`itemQuantityInput`).toLowerCase()
                //  Find best match
                const searchStringResult = stringSimilarity.findBestMatch(answerName, availableItems.map(i => i.name.toLowerCase()))
                const item = searchStringResult.bestMatch.rating >= 0.5
                    //  By name
                    ?
                    availableItems.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target)
                    //  Fallback search by ID
                    :
                    availableItems.find(i => parseInt(i.item_id) === parseInt(answerName))
                if (!item) {
                    itemTry++
                    // trackingMessageContent[`footer`] = `No item was found, try again please. After the third try it will automatically set to your current items made or set to zero items. This is your ${itemTry} attempt.`
                    updateTrackerMessage(`footer`, `No item was found, try again please. After the third try it will automatically set to your current items made or set to zero items. This is your ${itemTry} attempt.`)

                    if (itemTry > 3) {
                        updateTrackerMessage(`items`, `(${items.length}/${items.length}) items selected ${formatSelectedItem(items)}`)
                        // trackingMessageContent[`items`] = `(${items.length}/${items.length}) items selected ${formatSelectedItem(items)}`
                        buttonCollector.stop()
                    }
                } else {
                    // Confirm the item and then assign the quantity
                    const itemConfirmationRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`confirm`)
                                .setLabel(`Yes thats it`)
                                .setStyle(ButtonStyle.Success),
                        )
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancel`)
                                .setLabel(`No thats not the item`)
                                .setStyle(ButtonStyle.Danger)
                        )
                    const confirmationItem = await reply.send(`The item i found was: ${item.name}, is this correct`, {
                        components: [itemConfirmationRow]
                    })
                    const itemfilter = iteminteraction => [`confirm`, `cancel`].some(id => id === iteminteraction.customId) && iteminteraction.user.id === member
                    const itemListener = confirmationItem.createMessageComponentCollector({
                        itemfilter,
                        componentType: ComponentType.Button,
                        time: 60 * 1000
                    })

                    itemListener.on(`collect`, async button => {
                        function itemsHitMax() {
                            // trackingMessageContent[`footer`] = `Please hit the button to confirm the transaction or cancel to stop the transaction`
                            updateTrackerMessage(`footer`, `Please hit the button to confirm the transaction or cancel to stop the transaction`)
                            item_adding.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                            itemListener.stop()
                            return buttonCollector.stop()
                        }
                        await button.deferUpdate()
                        await confirmationItem.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))

                        if (button.customId === `confirm`) {
                            if (items.length === itemAmount) return itemsHitMax() // Check before to avoid possibly duplicating record
                            let quantity = 1
                            let testQuantity = parseInt(answerQuantity)
                            // Test to make sure the quantity is a number and if yes set to that value, if not set to 1.
                            if (Number.isInteger(testQuantity) && testQuantity > 0) {
                                quantity = testQuantity
                            } else {
                                // Assign the quantity as 1 if the quantity entered wasnt an integer or is a negative integer
                                await reply.send(`I'm sorry the quantity you typed in was not a number I will default the amount to 1`, {
                                    deleteIn: 5000,
                                    ephemeral: true
                                })
                            }

                            items.push([JSON.stringify(item), quantity])
                            itemNames.push(item.name)
                            // trackingMessageContent[`items`] = `(${items.length}/${itemAmount}) items selected ${formatSelectedItem(items)}`
                            updateTrackerMessage(`items`, `(${items.length}/${itemAmount}) items selected ${formatSelectedItem(items)}`)
                            if (items.length === itemAmount) return itemsHitMax() // Check again to end the phase 
                            // trackingMessageContent[`footer`] = `Please Hit the Item button to add another item`
                            updateTrackerMessage(`footer`, `Please Hit the Item button to add another item`)
                            itemListener.stop()
                        } else {
                            // trackingMessageContent[`footer`] = `Please Hit the Item button to try again`
                            updateTrackerMessage(`footer`, `Please Hit the Item button to try again`)
                        }
                    })

                    // Send a message to the users if they try to use the command when they didn't iniate it
                    itemListener.on(`ignore`, async (i) => {
                        i.reply({ content: `I'm sorry but only the user who sent this message may interact with it.`, ephemeral: true })
                    })

                    // What to do when the item collector ends
                    itemListener.on(`end`, async () => {
                        return confirmationItem.delete().catch(e => client.logger.warn(`Error has been handled\n${e}`))
                    })

                }
            })

        }

        /**
         * Commit the package to the database or ignore database call
         */
        async function confirmOrCancel() {
            let confirmationRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm`)
                        .setLabel(`Confirm`)
                        .setStyle(ButtonStyle.Success),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`cancel`)
                        .setLabel(`Cancel`)
                        .setStyle(ButtonStyle.Danger)
                )
            await trackingMessage.edit({
                components: [confirmationRow]
            })
            const filter = i => [`confirm`, `cancel`].some(id => id === i.customId) && i.user.id === interaction.member.id
            const confirmOrCancelListener = trackingMessage.createMessageComponentCollector({
                filter,
                componentType: ComponentType.Button,
                time: 60 * 1000
            })

            confirmOrCancelListener.on(`collect`, async button => {
                await button.deferUpdate()
                if (button.customId === `confirm`) {
                    let dataRole = []
                    roles.forEach(element => {
                        dataRole.push({
                            id: JSON.stringify(element)
                        })
                    })
                    let dataItem = []
                    items.forEach(element => {
                        dataItem.push({
                            object: element[0],
                            amount: element[1]
                        })
                    })
                    const data = {
                        acReward: acAmount,
                        roles: dataRole,
                        item: dataItem
                    }
                    const pack = rewardSchema.pack(data) // The package is saved as a string that will be read when getting unpacked and turned back into an object.
                    // trackingMessageContent[`footer`] = `Your package has been added, you can view the packages with '/makereward list'`
                    updateTrackerMessage(`footer`, `Your package has been added, you can view the packages with '/makereward list'`)
                    client.db.customRewardUtils.recordReward(interaction.guild.id, interaction.user.id, pack, packageName)
                    confirmOrCancelListener.stop()
                } else {
                    // trackingMessageContent[`footer`] = `The package has not been added, please run the command again if you wish to add a package.`
                    updateTrackerMessage(`footer`, `The package has not been added, please run the command again if you wish to add a package.`)
                    confirmOrCancelListener.stop()
                }

            })

            confirmOrCancelListener.on(`end`, async () => {
                client.db.databaseUtils.delCache(sessionID)
                // client.db.redis.del(sessionID)
                return await trackingMessage.edit({
                    components: []
                })
            })
        }

        /**
         * Update message as choice are made
         * @returns {void}
         */
        async function updateTrackerMessage(section, content) {
            if (!section) return new TypeError(`Parameter 'section' is missing in function 'updateTrackerMessage' in makereward.js`)
            if (!content) return new TypeError(`Parameter 'content' is missing in function 'updateTrackerMessage' in makereward.js`)
            trackingMessageContent[section] = content
            let finalizedTrackingMessageContent = Object.values(trackingMessageContent).join(`\n`)
            return await trackingMessage.edit({
                content: finalizedTrackingMessageContent
            })
        }

        /**
         * Create a collection of all the available roles the bot has adding accces to
         * @return {Collection}
         */
        async function setRoleOptions() {
            const botsHighestRole = interaction.guild.members.me.roles.highest // Highest role the bot has
            const guild_roles_fetch = await interaction.guild.roles.fetch()
            const guild_roles = Array.from(guild_roles_fetch)
            const roleOptions = new Collection()

            // Retrieve the available roles the bot has access to to prevent permission errors
            for (let i = 0; i < guild_roles.length; i++) {
                let role = guild_roles[i][1]
                let role_id = guild_roles[i][0]
                // Only continue if role in question is lower than the highest role the bot has and role is not the default @everyone
                if (role.comparePositionTo(botsHighestRole) < 0 && role != interaction.guild.members.me.roles.guild.roles.everyone) {
                    // Only continue if the role in question is not an integration role (ie. Not another bot role)
                    if (!role.managed) {
                        roleOptions.set(role_id, role)
                    }
                }
            }
            return roleOptions
        }

        /**
         * Format the items to be read nicely
         * @returns {string}
         */
        function formatSelectedItem() {
            if (items.length < 1) return ``
            let formated = ``
            items.forEach(element => {
                let tempObj = JSON.parse(element[0])
                formated += `\n**Item:** ${tempObj.name} **Quantity:** ${element[1]}`
                tempObj = null
            })
            return formated
        }

        /**
         * Format the items to be read nicely
         * @returns {string}
         */
        function formatSelectedRoles(r) {
            if (roles.length < 1) return ``
            let formated = ``
            roles.forEach(element => {
                let tempObj = r.get(element)
                formated += `\n**Role:** ${tempObj.name}`
                tempObj = null
            })
            return formated
        }

    },
    async listPackages(client, reply, interaction, options, locale) {
        const packages_raw = await client.db.customRewardUtils.getCustomRewards(interaction.guild.id)
        if (packages_raw.length < 1) return await reply.send(`I'm sorry you dont seem to have any packages. try to make one with /makereward create`)
        const packages_collection = new Collection()
        packages_raw.forEach(element => {
            let rewardSchema = new customReward(element.reward_name)
            packages_collection.set(element.reward_name, rewardSchema.unpack(element.reward))
            rewardSchema = null
        })
        const packages = []
        for (const raw_package of packages_collection) {
            packages.push(await formatPackage(raw_package[0], raw_package[1]))
        }

        async function formatPackage(packageName, pack) {
            const acReward = pack.acReward
            const roles = []
            const items = []
            if (pack.roles.length > 0) {
                const rawRoleIds = pack.roles.map(a => JSON.parse(a.id))
                for (const roleId of rawRoleIds) {
                    await interaction.guild.roles.fetch(roleId)
                    let rawRole = interaction.guild.roles.cache.get(roleId)
                    let role = `Role: ${rawRole.name}`
                    roles.push(role)
                }
            }
            if (pack.item.length > 0) {
                const rawItems = pack.item
                for (const i of rawItems) {
                    let item_raw = JSON.parse(i.object)
                    let item = `Item: ${item_raw.name} Quantity: ${i.amount}`
                    items.push(item)
                }
            }

            let formated_acReward = ``
            let formated_roles = ``
            let formated_items = ``

            if (acReward > 0) formated_acReward = `\n**AC:** ${acReward}`
            if (roles.length > 0) formated_roles = `\n**Roles:**\n${roles.join(`\n`)}`
            if (items.length > 0) formated_items = `\n**Items:**\n${items.join(`\n`)}`
            let formated = `**Package: ${packageName}**\n` + formated_acReward + formated_roles + formated_items
            return formated
        }

        return await reply.send(packages, {
            paging: true,
            header: `Custom reward packages for ${interaction.guild.name}`
        })
    },
    async autocomplete(client, interaction) {
        /**
         * Fill choices with the available packages found in DB
         */
        if (interaction.options.getSubcommand() !== `delete`) return
        const focusedValue = interaction.options.getFocused()
        const packages_raw = await client.db.customRewardUtils.getCustomRewards(interaction.guild.id)
        if (packages_raw.length < 1) return await interaction.respond(`I'm sorry you dont have any packages made currently`)
        const packages_collection = new Collection()
        packages_raw.forEach(element => {
            let rewardSchema = new customReward(element.reward_name)
            packages_collection.set(element.reward_name, rewardSchema.unpack(element.reward))
            rewardSchema = null
        })
        const choices = Array.from(packages_collection.keys())
        const filtered = choices.filter(choice => choice.startsWith(focusedValue))
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        )
    },
    async deletePackage(client, reply, interaction, options, locale) {
        const packageName = (options.getString(`package_name`)).toLowerCase()

        let confirmationRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm`)
                    .setLabel(`Confirm`)
                    .setStyle(ButtonStyle.Success),
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`cancel`)
                    .setLabel(`Cancel`)
                    .setStyle(ButtonStyle.Danger)
            )
        let confirmationMessage = await reply.send(`Please confirm the deletion of package: ${packageName}`)
        let confirmationMessageContent = `_ _`
        confirmationMessage.edit({
            components: [confirmationRow]
        })
        const filter = i => (i.customId === `confirm` || i.customId === `cancel`) && i.user.id === interaction.member.id
        const confirmOrCancelListener = confirmationMessage.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 60 * 1000
        })
        confirmOrCancelListener.on(`collect`, async xyx => {
            await xyx.deferUpdate()
            let whatButtonWasPressed = xyx.customId
            if (whatButtonWasPressed === `confirm`) {
                confirmationMessageContent = `Your package has been deleted`
                client.db.customRewardUtils.deleteReward(interaction.guild.id, packageName)
                confirmOrCancelListener.stop()
            } else {
                confirmationMessageContent = `Your package has not been deleted`
                confirmOrCancelListener.stop()
            }

        })

        confirmOrCancelListener.on(`end`, async () => {
            return await confirmationMessage.edit({
                content: confirmationMessageContent,
                components: [],
                embeds: []
            })
        })
    }
}