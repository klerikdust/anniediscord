const formatManager = require('../../utils/formatManager');
const sql = require("sqlite");
sql.open(".data/database.sqlite");

class eventJoin {
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
        const format = new formatManager(message);
        return [`sandbox`, `event-discussion`].includes(message.channel.name) ? initJoin()
            : format.embedWrapper(palette.darkmatte, `Please use the command in ${bot.channels.get('460615157056405505').toString()}`)

        async function initJoin() {

            let metadata = {
                user: {
                    id: message.author.id,
                    name: message.author.username,
                    tag: message.author.tag
                },
                balance: 0,
                ticket_fee: 250,
                role: `Event Participant`,
                event_ch: bot.channels.get(`460615157056405505`)
            }

            // Pre-defined messages
            const log = async (props = {}) => {

                // Props object
                props.code = !props.code ? `NULL_CODE` : props.code;
                props.emoticon = !props.emoticon ? `artcoins` : props.emoticon;



                //  Texts collection
                const logtext = {
                    "NULL_CODE": {
                        color: palette.darkmatte,
                        msg: `No available response.`,
                    },

                    "DUPLICATES": {
                        color: palette.red,
                        msg: `You have unused ticket, **${message.author.username}**.`
                    },

                    "INSUFFICIENT_BALANCE": {
                        color: palette.darkmatte,
                        msg: `Ops, you don't have enough artcoins to pay the event's ticket.`
                    }
                }

                const res = logtext[props.code];
                return format.embedWrapper(res.color, res.msg);

            }


            // Supporting transaction workflow.
            class transaction {

                constructor(metadata) {
                    this.data = metadata
                }

                // Retrive user's artcoins and assign them to metadata.
                get user_balance() {
                    return sql.get(`SELECT artcoins 
                         FROM userinventories 
                         WHERE userId = ${this.data.user.id}`)
                        .then(async data => metadata.balance += data.artcoins)
                }


                //  Substract user's artcoins by the amount of ticket fee.
                get withdraw() {
                    return sql.run(`UPDATE userinventories
                        SET artcoins = artcoins - ${this.data.ticket_fee}
                        WHERE userId = ${this.data.user.id}`)
                }


                //  Register role.
                get add_role() {
                    return message.guild.members.get(this.data.user.id).addRole(message.guild.roles.find(n => n.name === this.data.role));
                }

                // Returns true if user already have the ticket.
                get has_unused_ticket() {
                    return message.member.roles.find(r => r.name === this.data.role)
                }

            }


            // Request user's collection data.
            const cards_collection = () => {
                return sql.get(`SELECT foxie_card FROM collections WHERE userId = ${message.author.id}`)
                    .then(async data => data);
            }


            //  End process.
            const process = (proc, event_fever = null) => {

                proc.add_role;

                if (event_fever) {

                    /// Temp Disabled by Fwubbles per Foxling's Request: 05/17/19
                    ///               message.author.send(format.embedBase(palette.lightblue, 
                    ///                 `Hey **${metadata.user.name}**! Good luck and have fun with the event! ${utils.emoji(`AnnieHug`,bot)}
                    ///                 *Foxie's Event Fever Effect has been applied.*`))

                    message.channel.send(format.embedBase(palette.lightblue,
                        `Hey **${metadata.user.name}**! Good luck and have fun with the event! ${utils.emoji(`AnnieHug`, bot)}
                    *Foxie's Event Fever Effect has been applied! (Cost: 0 AC)*`))

                    metadata.event_ch.send(format.embedBase(palette.pink, `**floof-floof**! **${metadata.user.name}** has joined the event! ${utils.emoji(`bongofoxy`, bot)}`));
                }
                else {
                    metadata.event_ch.send(format.embedBase(palette.golden, `**${metadata.user.name}** has joined the event!`));
                    message.author.send(format.embedBase(palette.lightblue,
                        `Hey **${metadata.user.name}**! ${utils.emoji(`artcoins`, bot)}**${metadata.ticket_fee}** has been deducted from your balance.
                    Good luck and have fun with the event! ${utils.emoji(`AnnieHug`, bot)}`))
                    proc.withdraw;
                }

                return console.log(`${metadata.user.tag} has joined the event.`)

            }


            // Initialize module.
            const run = async () => {
                const trans = new transaction(metadata);
                const has_foxie = Object.values(await cards_collection())[0];

                await trans.user_balance;
                await this.stacks.pause(500);

                //Returns if user already have unused ticket.
                if (trans.has_unused_ticket) return log({ code: `DUPLICATES` });


                // Skip balance check if user has foxie's Event Fever effect.
                if (has_foxie) return process(trans, 1);


                //  Returns if user balance hasnt met the minimum requirement.
                if (metadata.balance < metadata.ticket_fee) return log({ code: `INSUFFICIENT_BALANCE` });


                // Proceed regular transaction
                process(trans);
            }

            run();
        }
    }
}
       
module.exports.help = {
    start: eventJoin,
    name:"event-join",
    aliases: ["join"],
    description: `allows you to submit to an event`,
    usage: `${require(`../../.data/environment.json`).prefix}join`,
    group: "Server",
    public: true,
    require_usermetadata: true,
    multi_user: true
}