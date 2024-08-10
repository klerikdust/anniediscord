"use strict"
const moment = require(`moment`)
const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
const {
	ApplicationCommandType,
	ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Claims free artcoins everyday. You can also help claiming your friend's dailies.
 * @author klerikdust
 */
module.exports = {
	name: `daily`,
	name_localizations: {
		fr: ``
	},
	description_localizations: {
		fr: ``
	},
	aliases: [`dly`, `daili`, `dail`, `dayly`, `attendance`, `dliy`],
	description: `Claims free artcoins everyday. You can also help claiming your friend's dailies!`,
	usage: `daily <User>(Optional)`,
	permissionLevel: 0,
	multiUser: false,
	applicationCommand: true,
	messageCommand: true,
	server_specific: false,
	options: [{
		name: `user`,
		description: `User you wish to claim daily of`,
		name_localizations: {
			fr: ``
		},
		description_localizations: {
			fr: ``
		},
		required: false,
		type: ApplicationCommandOptionType.User
	}],
	type: ApplicationCommandType.ChatInput,
	cooldown: [23, `hours`],
	rewardAmount: 250,
	bonusAmount: 10,
	async execute(client, reply, message, arg, locale) {
		const userLib = new User(client, message)
		let targetUser = arg ? await userLib.lookFor(arg) : message.author
		if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
		//  Normalize structure
		targetUser = targetUser.master || targetUser
		return await this.claimDaily(client, message, reply, locale, targetUser)
	},
	async Iexecute(client, reply, interaction, options, locale) {
		const targetUser = options.getUser(`user`) || interaction.member.user
		return await this.claimDaily(client, interaction, reply, locale, targetUser)
	},
	async claimDaily(client, messageRef, reply, locale, user) {
		const userLib = new User(client, messageRef)
		//  Normalize structure
		const targetUserData = await userLib.requestMetadata(user, 2, locale)
		const isSelf = userLib.isSelf(user.id)
		const now = moment()
		const lastClaimAt = await client.db.systemUtils.toLocaltime(targetUserData.dailies.updated_at)
		const localed = lastClaimAt == `now` ? moment().toISOString() : lastClaimAt

		//	Returns if user next dailies still in cooldown (refer to property `this.cooldown` in the constructor)
		if (now.diff(localed, this.cooldown[1]) < this.cooldown[0]) return await reply.send(locale.DAILIES[isSelf ? `AUTHOR_IN_COOLDOWN` : `OTHERS_IN_COOLDOWN`], {
			thumbnail: user.displayAvatarURL(),
			topNotch: isSelf ?
				`**Are you craving for artcoins?** ${await client.getEmoji(`692428578683617331`)}` :
				`**${user.username} already claimed their dailies!** ${await client.getEmoji(`692428748838010970`)}`,
			socket: {
				time: moment(localed).add(...this.cooldown).fromNow(),
				user: user.username,
				prefix: client.prefix
			}
		})
		//  If user hasn't claimed their dailies over 2 days, the current total streak will be reset to zero.
		let totalStreak = now.diff(localed, `days`) >= 2 ? 0 : targetUserData.dailies.total_streak + 1
		//  If user has a poppy card, ignore streak expiring check.
		const hasPoppy = targetUserData.inventory.poppy_card
		if (hasPoppy) totalStreak = targetUserData.dailies.total_streak + 1
		let bonus = totalStreak ? this.bonusAmount * totalStreak : 0
		client.db.userUtils.updateUserDailies(totalStreak, user.id, messageRef.guild.id)
		client.db.databaseUtils.updateInventory({
			itemId: 52,
			value: this.rewardAmount + bonus,
			userId: messageRef.member.id,
			guildId: messageRef.guild.id
		})
		await reply.send(locale.DAILIES.CLAIMED, {
			status: `success`,
			thumbnail: user.displayAvatarURL(),
			topNotch: totalStreak ? `**__${totalStreak} Days Chain!__**` : ` `,
			socket: {
				amount: `${await client.getEmoji(`758720612087627787`)}${commanifier(this.rewardAmount)}${bonus ? `(+${commanifier(bonus)})` : ``}`,
				user: user.username,
				praise: totalStreak ? `*Keep the streaks up!~♡*` : `*Comeback tomorrow~♡*`
			}
		})
		return await reply.send(locale.DAILIES.TO_REMIND, {
			simplified: true,
			socket: {
				prefix: client.prefix
			}
		})
	}
}