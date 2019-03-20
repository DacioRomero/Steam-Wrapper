const axios = require('axios');

class SteamWrapper {
  constructor(key) {
    this.key = key;
  }

  static async GetAppDetails(appid, filters = []) {
    const res = await axios.get('https://store.steampowered.com/api/appdetails/', {
      params: {
        appids: appid,
        filters: filters.join(','),
      },
    });

    return res.data;
  }

  async GetOwnedGames(steamid, include_played_free_games = 1) {
    const res = await axios.get('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/', {
      params: {
        key: this.key,
        steamid,
        include_played_free_games,
      },
    });

    const { games } = res.data.response;

    return games.map(game => game.appid);
  }

  async GetPlayerSummaries(...steamids) {
    const res = await axios.get('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/', {
      params: {
        key: this.key,
        steamids: steamids.join(','),
      },
    });

    let { players } = res.data.response;

    players = players.reduce(
      (obj, player) => Object.assign({}, obj, {
        [player.steamid]: player,
      }), {},
    );

    return players;
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
