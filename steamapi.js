// utils/steam.js
const rp = require('request-promise');

class SteamAPI {
    constructor(key) {
        this.key = key;
    }

    getAppDetails(appid, filters = null) {
        return rp.get('https://store.steampowered.com/api/appdetails', {
            qs: {
                appids: appid,
                filters,
                format: 'json'
            },
            json: true
        })
    }

    getOwnedGames(steamid) {
        return rp.get('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1', {
                qs: {
                    key: this.key,
                    steamid,
                    include_played_free_games: 1
                },
                json: true
            })
            .then(response => {
                return Promise.resolve(response.response);
            })
    }
}

module.exports = (key = null) => {
    key = key || process.env.STEAM_API_KEY;
    if (key == null) {
        throw 'Steam API key must be provided as argumen`t or in environment!'
    }
    return new SteamAPI(key);
}
