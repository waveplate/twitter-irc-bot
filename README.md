### *note: twitter seems to have removed the ability to read tweets from the free tier of the v1.1 API, so if the bot isn't working, that's likely why*

# twitter-irc-bot (0.1.1)
this is an irc bot that previews tweets whenever a link to a tweet is posted in a channel

![twitter-irc-bot](https://i.imgur.com/cI1rIe8.png)

if you have `img2irc` installed, or use the included docker container, it can optionally show the profile picture of the user

# required configuration
edit `config.json.example`, the `irc` and `twitter` sections are self-explanatory

> note: you **must** do this first before proceding!

# quickstart with docker
`docker-compose up -d`


# running without docker
### 1) build and install `img2irc` (optional)
`git clone https://github.com/anatolybazarov/img2irc`

`cd img2irc && cargo build --release`

`sudo cp target/release/img2irc /usr/local/bin`

### 2) install `npx` and `tsx` if not installed already
`sudo npm install -g npx`

`sudo npm install -g tsx`

### 3) start `twitter-irc-bot`
`npx tsx index.ts`

# commands
| command | argument | function |
| --- | --- | --- |
| `!image` | `on` or `off`  | toggles whether the profile picture should be displayed |
| `!width` | default is `10` | the width of the profile picture |
| `!len` | default is `400` | the maximum number of characters for the tweet, after which it will truncate and add an ellipsis |
| `!wrap` | default is `60` | the number of characters after which to wrap the text, influences the width of the text box |

# optional configuration

### img2irc

the `bot.ansi` section controls the arguments which will be sent to `img2irc`, and correspond to the command-line arguments which `img2irc` takes

for information about those arguments, see the usage details [here](https://github.com/anatolybazarov/img2irc#usage)

the default settings are

```
        "ansi": {
            "width": 10,
            "contrast": 30
        },
```

where `width` is the width of the profile picture, and `contrast` increases the contrast by `30` (max: `255`)

for flags which do not take any arguments, simply set the value to `true`, e.g.,

```
        "ansi": {
            "width": 10,
            "contrast": 30,
            "sharpen": true
        },
```

### text colours

you can change the colour of the display name, username, date, tweet text, retweets and likes

```
        "colors": {
            "name": "",
            "user": "",
            "date": "14",
            "text": "",
            "retweets": "09",
            "likes": "04"
        },
```

leaving the field blank means no explicit colour. here are the [mirc colour codes](https://www.mirc.com/colors.html)

if the colour code is a single digit, you should pad it with a leading zero (e.g., `09` instead of `9`)

### symbols

you can modify which symbols to use for the retweets and likes as well

```
        "symbols": {
            "retweets": "↻",
            "likes": "❤"
        }
```
