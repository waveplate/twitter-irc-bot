import Twitter from 'twitter-lite';
import { exec } from 'child_process';
import fs from 'fs';

const IRC = require('irc-framework');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

exec('which img2irc', (err, stdout, stderr) => {
    if (err) {
        console.error("img2irc not found, disabling twitpic");
        config.bot.twitPic = false;
    }
});

const client = new Twitter(config.twitter);

var bot = new IRC.Client();

bot.connect({
    nick: config.irc.nick,
    username: config.irc.username,
    gecos: config.irc.gecos,
    host: config.irc.host,
    port: config.irc.port,
    tls: config.irc.port == 6697 ? true : false,
    rejectUnauthorized: false,
});

bot.on('debug', function (event) {
    console.log(event);
});

bot.on('registered', () => {
    config.irc.channels.forEach((channel: string) => {
        console.log(`joining ${channel}`);
        bot.join(channel);
    });
});

bot.on('message', function (event) {
    var args = event.message.split(' ');
    var text = args.slice(1).join(' ');

    if (event.message.match(/^!image /)) {
        config.bot.twitPic = (text == "on") ? true : false;
        event.reply("twitpic " + (config.bot.twitPic ? "on" : "off"));
    }

    if (event.message.match(/^!width /)) {
        config.bot.ansi.width = parseInt(text);
        event.reply("twitpic width " + config.bot.ansi.width);
    }

    if (event.message.match(/^!len /)) {
        config.bot.maxTweetLength = parseInt(text);
        event.reply("maxTweetLength " + config.bot.maxTweetLength);
    }

    if (event.message.match(/^!wrap /)) {
        config.bot.wrapLen = parseInt(text);
        event.reply("wrapLen " + config.bot.wrapLen);
    }

    if (event.message.match(/twitter\.com\/.+?\/status\/\d+/)) {
        var tweetId = event.message.match(/twitter\.com\/.+?\/status\/(\d+)/)[1];
        getTweet(tweetId).then((tweet) => {
            drawTweet(tweet, event);
        });
    }
});

function wrapText(input: string, lineLength: number): string {
    const paragraphs = input.split("\n");
    let result = '';

    for (let paragraph of paragraphs) {
        const words = paragraph.split(' ');
        let line = '';

        for (let word of words) {
            if (line.length + word.length <= lineLength) {
                line += line.length ? ' ' + word : word;
            } else {
                result += line + "\n";
                line = word;
            }
        }

        result += line + '\n';
    }

    return result.trim();
}

function getAnsi(url: string, options: any): Promise<string> {
    let opts: string[] = [];

    Object.keys(options).forEach((key: string) => {
        if(options[key] === true)
            opts.push(`--${key}`);
        else
            opts.push(`--${key}="${options[key]}"`);
    });

    return new Promise((resolve, reject) => {
        exec(`img2irc ${url} ${opts.join(' ')}`, (err, stdout, stderr) => {
            stdout = stdout.replace(/\n+$/, '');
            stdout = stdout.replace(/(\n|$)/g, "\x0f\n");

            if (err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });
}

function appendMultilineStrings(str1: string, str2: string, padding: number): string {
    const lines1 = str1.split('\n');
    const lines2 = str2.split('\n');
    const maxLength = Math.max(lines1.length, lines2.length);

    let result = '';

    for (let i = 0; i < maxLength; i++) {
        let line1 = lines1[i] || '';
        const line2 = lines2[i] || '';
        const line1padding = config.bot.ansi.width - line1.length;
        const line1paddingStr = line1padding > 0 ? ' '.repeat(line1padding) : '';
        line1 += line1paddingStr;

        result += line1 + " ".repeat(padding) + line2 + (i < maxLength - 1 ? '\n' : '');
    }

    return result;
}

function drawTweet(tweet: any, event: any): void {
    if(tweet.full_text.length > config.bot.maxTweetLength)
        tweet.full_text = tweet.full_text.substring(0, config.bot.maxTweetLength) + "...";

    const twitDate = new Intl.DateTimeFormat(
        'en-US',
        { year: 'numeric', month: 'short', day: '2-digit' }
    )
    .format(new Date(tweet.created_at))
    .replace(/,/, '');

    let stats =  `\x03${config.bot.colors.retweets}${config.bot.symbols.retweets} ${tweet.retweet_count}\x03 `;
        stats += `\x03${config.bot.colors.likes}${config.bot.symbols.likes} ${tweet.favorite_count}\x03`;

    let text =  `\x03${config.bot.colors.name}\x1f\x02${tweet.user.name}\x02\x1f `;
        text += `\x03${config.bot.colors.user}@${tweet.user.screen_name} `;
        text += `\x03${config.bot.colors.date}${twitDate}\n`;

    let wrapped = wrapText(tweet.full_text, config.bot.wrapLen) + "\n";

    if(config.bot.colors.text != ""){
        let lines = wrapped.split("\n");
        for(let i = 0; i < lines.length; i++){
            lines[i] = `\x03${config.bot.colors.text}${lines[i]}\x03`;
        }
        wrapped = lines.join("\n");
    }
    
    text += wrapped;
    
    if(config.bot.twitPic == true) {
        getAnsi(tweet.user.profile_image_url_https, config.bot.ansi).then((ansi) => {
            const textHeight = text.split('\n').length;
            const ansiHeight = ansi.split('\n').length;
            text += textHeight < ansiHeight ? "\n".repeat(ansiHeight - textHeight - 1) : '';
            text += stats;
            event.reply(appendMultilineStrings(ansi, text, 1));
        });
    } else {
        text += `\n${stats}`;
        event.reply(text);
    }
}

async function getTweet(tweetId: string): Promise<any> {
    try {
        const tweet = await client.get("statuses/show", { id: tweetId, tweet_mode: 'extended' });
        return tweet;
    } catch (error) {
        console.error(error);
    }
}