require('dotenv').config();
const { Telegraf, session, Scenes } = require('telegraf');
const fetch = require('node-fetch');

// Destructure BaseScene and Stage from Scenes
const { BaseScene, Stage } = Scenes;

// Load environment variables
const botToken = process.env.BOT_TOKEN;
const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

// Create a new bot instance
const bot = new Telegraf(botToken);

// Scene to handle the multi-step process
const registrationScene = new BaseScene('registrationScene');

registrationScene.enter((ctx) => ctx.reply('Welcome! Please enter your registration number.'));

registrationScene.on('text', (ctx) => {
    const regdNumber = ctx.message.text;
    ctx.session.regdNumber = regdNumber;
    ctx.scene.enter('parentNumberScene');
});

const parentNumberScene = new BaseScene('parentNumberScene');

parentNumberScene.enter((ctx) => ctx.reply('Please enter the parent\ number:'));

parentNumberScene.on('text', async (ctx) => {
    const parentNumber = ctx.message.text;
    const regdNumber = ctx.session.regdNumber;
    try {
        const response = await fetch(`${googleScriptUrl}?regd_number=${regdNumber}&parent_number=${parentNumber}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        let message = "";
        if (data.error) {
            message = data.error;
        } else {
            message = `SUMMER INTERNSHIP ATTENDANCE\nNAME: ${data.NAME}\nREGD NUMBER: ${data.REGD_NUMBER}\nSECTION: ${data.SECTION}\nPERCENTAGE TOTAL: ${data.PERCENTAGE_TOTAL}\nPRESENT: ${data.PRESENT}\nABSENT: ${data.ABSENT}\n\n To Restart click /start`;
        }
        ctx.reply(message);
    } catch (error) {
        console.error('Error fetching data:', error);
        ctx.reply('Sorry, there was an error retrieving your information. Please try again later.');
    }
    ctx.scene.leave(); // Exit the scene after handling the request
});

// Create the stage manager and register the scenes
const stage = new Stage([registrationScene, parentNumberScene]);
bot.use(session());
bot.use(stage.middleware());

// Handle '/start' command
bot.start((ctx) => ctx.scene.enter('registrationScene'));

// Handle '/restart' command to restart the chat
bot.command('restart', (ctx) => {
    ctx.scene.enter('registrationScene');
});const http = require('http');
const port = process.env.PORT || 8080;

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Bot is running...');
}).listen(port);

console.log(`Server running on port ${port}`);

// Launch the bot
bot.launch();

console.log('Bot is running...');
