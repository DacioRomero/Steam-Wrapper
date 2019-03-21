const axios = require('axios');

class SteamWrapper {
  constructor(key) {
    this.key = key;
  }

  static async GetAppDetails(appid, filters = []) {
    let result = null;

    try {
      const res = await axios.get('https://store.steampowered.com/api/appdetails/', {
        params: {
          appids: appid,
          filters: filters.join(','),
        },
      });

      const { data } = res;

      if (data) {
        const { [appid]: app } = data;

        if (app.success) {
          result = app.data;
        }
      }
    } catch (err) {
      // Continue to return null;
    }

    return result;
  }

  async GetOwnedGames(steamid, include_played_free_games = 1) {
    let result = null;

    try {
      const res = await axios.get('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/', {
        params: {
          key: this.key,
          steamid,
          include_played_free_games,
        },
      });

      const { response } = res.data;

      if (Object.keys(response)) {
        result = response.games.map(game => game.appid);
      }
    } catch (err) {
      // Continue to return null
    }

    return result;
  }

  async GetPlayerSummaries(...steamids) {
    let result = null;

    try {
      const res = await axios.get('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/', {
        params: {
          key: this.key,
          steamids: steamids.join(','),
        },
      });

      let { players } = res.data.response;

      const defaults = steamids.reduce((prev, id) => (
        { ...prev, [id]: null }
      ), {});

      players = players.reduce((prev, player) => {
        const { steamid, ...newPlayer } = player;

        return { ...prev, [steamid]: newPlayer };
      }, {});

      result = { ...defaults, ...players };
    } catch (err) {
      // Continue
    }

    return result;
  }
}

module.exports = (userKey = null) => {
  const key = userKey || process.env.STEAM_API_KEY;

  if (key == null) {
    throw Error('Steam API: Key must be provided as argument or in environment');
  } else {
    return new SteamWrapper(key);
  }
};
