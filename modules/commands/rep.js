const ms = require('parse-ms');
const formatManager = require('../../utils/formatManager');
const sql = require("sqlite");

class rep {
	constructor(Stacks) {
		this.author = Stacks.meta.author;
		this.data = Stacks.meta.data;
		this.utils = Stacks.utils;
		this.message = Stacks.message;
		this.args = Stacks.args;
		this.palette = Stacks.palette;
		this.stacks = Stacks;
	}

	async execute() {
		let message = this.message;
		let bot = this.stacks.bot;
		let palette = this.stacks.palette;
		let format = new formatManager(message);

		return ["bot", "bot-games", "cmds"].includes(message.channel.name) ? getReputation() :
			format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)


		async function getReputation() {
			const get = {
				username(id) {
					return bot.users.get(id).username;
				},
				incrementRep(user) {
					sql.get(`SELECT * FROM userdata WHERE userId=${user}`)
						.then(async data => {
							sql.run(`UPDATE userdata SET reputations = "${data.reputations + 1}" WHERE userId=${user}`);
						})
				}
			}

			const user = await utils.userFinding(message, message.content.substring(5));
			let cooldown = 8.64e+7;

			sql.get(`SELECT * FROM usercheck WHERE userId ="${message.author.id}"`).then(async usercheckrow => {
				if ((usercheckrow.repcooldown !== null) && cooldown - (Date.now() - usercheckrow.repcooldown) > 0) {
					let timeObj = ms(cooldown - (Date.now() - usercheckrow.repcooldown));
					return format.embedWrapper(
						palette.red,
						`**${message.author.username}**, you can give reputation again in`)
						.then(async msg => {
							msg.channel.send(`**${timeObj.hours} h** : **${timeObj.minutes} m** : **${timeObj.seconds} s**`)
						})
				} else if (!args[0]) {
					return format.embedWrapper(palette.darkmatte, `Could you please specify the user? (example: \`>rep\` \`@Kitomi\`)`);
				} else if (user.id === message.author.id) {
					return format.embedWrapper(palette.darkmatte, `Sorry, you can't give rep to yourself. :(`);
				} else {
					await get.incrementRep(user.id);
					sql.run(`UPDATE usercheck SET repcooldown = "${Date.now()}" WHERE userId = ${message.author.id}`);
					return format.embedWrapper(palette.halloween, `**${get.username(user.id)}** has received +1 rep point from **${message.author.username}**. <:Annie_Smug:523686816545636352>`);
				}
			})
		}
	}
}

module.exports.help = {
	start: rep,
	name: "rep",
	aliases: [],
	description: `Gives rep to a user`,
	usage: `${require(`../../.data/environment.json`).prefix}rep @user`,
	group: "General",
	public: true,
	require_usermetadata: true,
	multi_user: true
}