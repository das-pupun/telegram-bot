require('dotenv').config();
const { Telegraf, session, Scenes, Markup } = require('telegraf');
const fetch = require('node-fetch');

const { BaseScene, Stage } = Scenes;

const botToken = process.env.BOT_TOKEN;
const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

const bot = new Telegraf(botToken);

// Helper function to escape Markdown special characters except for percentage sign
function escapeMarkdown(text) {
  return (text || '').toString().replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// Scene to handle course selection
const courseSelectionScene = new BaseScene('courseSelectionScene');

courseSelectionScene.enter((ctx) => {
  ctx.reply('👋 Welcome GIFTIAN! Please choose your course:', Markup.inlineKeyboard([
    [Markup.button.callback('🎓 BTECH-26P', 'BTECH-26P')],
    [Markup.button.callback('🎓 MBA', 'MBA')],
    [Markup.button.callback('🎓 MCA', 'MCA')],
    [Markup.button.callback('🎓 BTECH-27P', 'BTECH-27P')],
  ]));
});

courseSelectionScene.action(['BTECH-26P', 'MBA', 'MCA', 'BTECH-27P'], (ctx) => {
  const course = ctx.match[0];
  ctx.session.course = course;
  ctx.answerCbQuery();
  ctx.reply(`✅ You selected ${course}. Please enter your registration number:`);
  ctx.scene.enter('registrationScene');
});

// Scene to handle registration number
const registrationScene = new BaseScene('registrationScene');

registrationScene.on('text', (ctx) => {
  const regdNumber = ctx.message.text;
  ctx.session.regdNumber = regdNumber;
  ctx.reply('📝 Please enter the parent\'s number:');
  ctx.scene.enter('parentNumberScene');
});

// Scene to handle parent's number and fetch data
const parentNumberScene = new BaseScene('parentNumberScene');

parentNumberScene.on('text', async (ctx) => {
  const parentNumber = ctx.message.text;
  const { regdNumber, course } = ctx.session;

  try {
    const response = await fetch(`${googleScriptUrl}?course=${course}&regd_number=${regdNumber}&parent_number=${parentNumber}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    let message = "";
    if (data.error) {
      message = `❌ ${data.error}`;
    } else {
      const escapedName = escapeMarkdown(data.NAME);
      const escapedRegdNumber = escapeMarkdown(data.REGD_NUMBER);
      const escapedSection = escapeMarkdown(data.SECTION);
      const escapedPercentageTotal = data.PERCENTAGE_TOTAL.toString(); // No need to escape percentage
      const escapedPresent = escapeMarkdown(data.PRESENT.toString());
      const escapedAbsent = escapeMarkdown(data.ABSENT.toString());

      message = `📊 *SUMMER INTERNSHIP ATTENDANCE*\n\n*Name:* ${escapedName}\n*Registration Number:* ${escapedRegdNumber}\n*Organization:* ${escapedSection}\n*Percentage Total:* ${escapedPercentageTotal}%\n*Present:* ${escapedPresent}\n*Absent:* ${escapedAbsent}\n\nTo restart, click /start`;
    }
    ctx.replyWithMarkdown(message);
  } catch (error) {
    console.error('Error fetching data:', error);
    ctx.reply('⚠️ Sorry, there was an error retrieving your information. Please try again later.');
  }
  ctx.scene.leave();
});

// Create the stage manager and register the scenes
const stage = new Stage([courseSelectionScene, registrationScene, parentNumberScene]);
bot.use(session());
bot.use(stage.middleware());

// Handle '/start' command
bot.start((ctx) => ctx.scene.enter('courseSelectionScene'));

// Handle '/restart' command to restart the chat
bot.command('restart', (ctx) => {
  ctx.scene.enter('courseSelectionScene');
});

// Handle unexpected text messages
bot.on('text', (ctx) => {
  ctx.reply('⚠️ Please use the commands /start to interact with the bot.');
});
const http = require('http');
const port = process.env.PORT || 10000;
// Launch the bot
bot.launch();

console.log('Bot is running...');
