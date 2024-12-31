import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

const ADD_MINECRAFT_IP_COMMAND = {
  name: 'add-minecraft-ip',
  description: 'Adds IP address to the Minecraft server',
  options: [
    {
      type: 3,
      name: 'ipaddress',
      description: 'Enter your IP Address',
      required: true
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
}

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND, ADD_MINECRAFT_IP_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
