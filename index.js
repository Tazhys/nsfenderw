const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

class SimpleClient {
    constructor(token) {
        if (!token) {
            throw new Error("A Discord bot token is required.");
        }
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });

        this.token = token;

        this._registerListeners();
    }

    async _checkForInvites(inviteCode) {
        const response = await axios.get(`https://discord.com/api/v10/invites/${inviteCode}`, {
            headers: {
                'Authorization': `Bot ${this.client.token}`,
                'Content-Type': 'application/json'
            }
        });

        const guildName = response.data.guild?.name?.toLowerCase() || '';
        const nsfwRegex = /(porn|sex|xxx|nsfw|adult|sexcam)/i;

        const isNSFW = nsfwRegex.test(guildName);

        return {
            inviteCode,
            guildName,
            isNSFW
        };
    }

    _registerListeners() {
        this.client.on('ready', () => {
            console.log(`Ready to play whack-a-mole with with scammers!`);
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            if (!message.guild) return;

            const member = message.guild.members.cache.get(message.author.id);

            console.log(
                `[${message.guild.name}] #${message.channel.name} (${message.author.tag}): ${message.content}`
            );


            const INVITE_REGEX = /\b(https?:\/\/)?(www\.)?(discord\.gg|discord\.com\/invite|ptb\.discord\.com\/invite)\/([a-zA-Z0-9-]+)\b/i;

            const inviteMatch = message.content.match(INVITE_REGEX);
            if (inviteMatch) {
                const inviteCode = inviteMatch[4];
                const inviteInfo = await this._checkForInvites(inviteCode);

                if (inviteInfo.isNSFW) {
                    await message.delete();
                    message.channel.send(`${member}, you are not allowed to post NSFW invites.`);
                }
            }
        });
    }
    connect() {
        this.client.login(this.token);
    }
}

new SimpleClient(process.env.DISCORD_TOKEN).connect();
