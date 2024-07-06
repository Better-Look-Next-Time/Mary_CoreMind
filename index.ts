import { env } from 'bun'
import { ActivityType, Client, Events, GatewayIntentBits } from 'discord.js'

import { trigerWords } from './src/assets/trigerWords'
import { delitingTrigerWords } from './src/helpers/delitingTrigerWords'

import { mary } from './src/mary'

const Bot = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
})

Bot.on(Events.ClientReady, async () => {
  Bot.user?.setActivity({ name: 'SANABI', type: ActivityType.Playing })
  console.log('Bot run')
})

Bot.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return
  const MessageContent: string = message.content.toLowerCase()
  if (trigerWords.some(word => MessageContent.includes(word))) {
    await message.channel.sendTyping()
    const typeing = setInterval(() => message.channel.sendTyping(), 5000)
    const answer = await mary(delitingTrigerWords(MessageContent), message.channelId, message.author.username)
    clearInterval(typeing)
    await message.reply(answer)
    console.log('Bot answer from message')
  }
  else if (message.reference && message.reference.messageId) {
    const orginalMessage = await message.channel.messages.fetch(message.reference.messageId)
    if (orginalMessage.author.id === Bot.user?.id) {
      await message.channel.sendTyping()
      const typeing = setInterval(() => message.channel.sendTyping(), 5000)
      const answer = await mary(delitingTrigerWords(MessageContent), message.channelId, message.author.username)
      clearInterval(typeing)
      await message.reply(answer)
    }
  }
})

Bot.login(env.DISCORD_TOKEN)
