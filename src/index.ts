import axios, { AxiosInstance } from 'axios';

import keyBy from 'lodash.keyby';
import zipObject from 'lodash.zipobject';

// Modifed verison of https://stackoverflow.com/a/37016639
const urlRe = /(?:https?:\/\/)?steamcommunity\.com\/(?:profiles|id)\/([^/?]+)/;
const steamidRe = /\d{17}/;
const bigpicture = axios.create({
  baseURL: 'https://store.steampowered.com/api/',
});

export enum PersonaState {
  Offline = 0,
  Online = 1,
  Busy = 2,
  Away = 3,
  Snooze = 4,
  LookingToTrade = 5,
  LookingToPlay = 6,
}

export enum CommunityVisibilityState {
  Private = 1,
  FriendsOnly = 2,
  FriendsOfFriends = 3,
  UsersOnly = 4,
  Public = 5,
}

export interface PlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: PersonaState;
  communityvisibilitystate: CommunityVisibilityState;
  lastlogoff: number;
  profilestate: 0 | 1;
  commentpermission?: 1;

  // Private
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;

  gameid?: string;
  gameserverip?: string;
  gameextrainfo?: string;

  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

interface PlayerSummariesData {
  response: {
    players: PlayerSummary[];
  };
}

interface LibraryData {
  response: {
    game_count: number;
    games: {
      appid: number;
      playtime_forever: number;
    }[];
  };
}

interface AppDetailsData {
  [x: string]: {
    success: boolean;
    // TODO: Create an interface for AppDetails
    data: any;
  };
}

interface ResolveVanityURLData {
  response: {
    success: 1 | 42;
    steamid?: string;
    message?: string;
  };
}

export default class SteamWrapper {
  private steampowered: AxiosInstance;

  public constructor(key: string) {
    this.steampowered = axios.create({
      baseURL: 'https://api.steampowered.com/',
      params: { key },
    });
  }

  // TODO: Create an interface for AppDetails
  public static async GetAppDetails(appid: string, filters: string[] = []): Promise<any> {
    const {
      data: {
        [appid]: {
          success,
          data: details,
        },
      },
    }: { data: AppDetailsData } = await bigpicture.get('/appdetails/', {
      params: {
        appids: appid,
        filters: filters.join(','),
      },
    });

    if (!success) {
      throw Error(`Unable to get details for app ${appid}`);
    }

    return details;
  }

  public async GetOwnedGames(steamid: string, includeFree: boolean = true): Promise<number[]> {
    const {
      data: { response: { games } },
    }: { data: LibraryData } = await this.steampowered.get('/IPlayerService/GetOwnedGames/v1/', {
      params: {
        steamid,
        'include_played_free_games': Number(includeFree),
      },
    });

    return games.map((game): number => game.appid);
  }

  public async GetPlayerSummaries(...steamids: string[]): Promise<Record<string, false | PlayerSummary>> {
    const {
      data: { response: { players } },
    }: { data: PlayerSummariesData } = await this.steampowered.get('/ISteamUser/GetPlayerSummaries/v2/', {
      params: { steamids: steamids.join(',') },
    });

    const defaults: Record<string, false> = zipObject(steamids, Array(steamids.length).fill(false));

    return { ...defaults, ...keyBy(players, 'steamid') };
  }

  public async GetSteamId64(input: string): Promise<string> {
    const urlMatch = urlRe.exec(input);
    const profile = (urlMatch && urlMatch[1]) || input;

    const steamidMatch = steamidRe.exec(profile);

    if (steamidMatch) {
      return steamidMatch[0];
    }

    const {
      data: {
        response: {
          success,
          steamid,
          message,
        },
      },
    }: { data: ResolveVanityURLData } = await this.steampowered.get('/ISteamUser/ResolveVanityURL/v1/', {
      params: { vanityurl: profile },
    });

    if (success === 1) {
      return steamid as string;
    }

    // success === 42
    throw Error(message);
  }
}
