import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import {getRandomEmoji} from './utils.js';
import * as net from "node:net";
import {createApiClient} from "dots-wrapper";
import * as util from "node:util";

const dots = createApiClient({token: process.env.DIGITAL_OCEAN_KEY});
// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
const router = express.Router()

router.get('/test', function (req, res) {
  return res.send({
    data: {
      content: 'Hello world!'
    }
  })
})

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
router.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction type and data
  const {type, data} = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({type: InteractionResponseType.PONG});
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const {name} = data;

    // "test" command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `hello world ${getRandomEmoji()}`,
        },
      });
    }

    switch (name) {
      case 'add-minecraft-ip':
        try {
          const {options: [{value: ipAddress}]} = data;
          if (!net.isIPv4(ipAddress))
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `IP Address \`${ipAddress}\` is invalid`,
              },
            });

          const firewall = await dots.firewall.listFirewalls({per_page: 100}).then((firewalls) =>
            firewalls.data.firewalls.find(({name}) => name === 'Minecraft-Pass'));

          if (!firewall)
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Firewall was not found`,
                mentions: [{username: 'Kabbandre'}]
              },
            });

          if (firewall.inbound_rules.some(rule =>
            rule.sources.addresses.includes(ipAddress)))
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `\`${ipAddress}\` is already whitelisted`,
              },
            });

          firewall.inbound_rules = firewall.inbound_rules.map(rule => {
            rule.sources.addresses.push(ipAddress)
            return rule
          })

          const {status} = await dots.firewall.updateFirewall(firewall);

          if (status !== 200)
            res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Updating firewall has crapped out, status: ${status}`,
              },
            });

          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Added \`${ipAddress}\`!`,
            },
          });
        } catch (e) {
          res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Something went **TERRIBLY** wrong`,
            },
          });
        }
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({error: 'unknown command'});
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({error: 'unknown interaction type'});
});

app.use('/bot', router)

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
