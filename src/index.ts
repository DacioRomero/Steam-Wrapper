import axios, { AxiosInstance, AxiosResponse } from 'axios';

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

export enum AppType {
  Game = 'game',
  DLC = 'dlc',
  Demo = 'demo',
  Advertising = 'advertising',
  Mod = 'mod',
  Video = 'video',
}

export enum AppControllerSupport {
  Partial = 'partial',
  Full = 'full',
}

// https://wiki.teamfortress.com/wiki/User:RJackson/StorefrontAPI#appdetails
export interface AppDetails {
  type: AppType;
  name: string;
  steam_appid: number;
  required_age: number;
  controller_support?: AppControllerSupport;
  dlc?: number[];
  detailed_description: string;
  about_the_game: string;
  short_description: string;
  fullgame?: {
    appid: string | null;
    name: string;
  };
  supported_languages: string;
  header_image: string;
  website: string;
  pc_requirements: {
    minimum?: string;
    recommended?: string;
  } | [];
  mac_requirements: {
    minimum?: string;
    recommended?: string;
  } | [];
  linux_requirements: {
    minimum?: string;
    recommended?: string;
  } | [];
  legal_notice?: string;
  developers?: string[];
  publishers: string[];
  demos?: {
    appid: number;
    description: string;
  }[];
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
  };
  packages: number[];
  package_groups:  {
    name: string;
    title: string;
    description: string;
    selection_text: string;
    save_text: string;
    display_type: number;
    is_recurring_subscription: string;
    subs: {
      packageid: number;
      percent_savings_text: string;
      percent_savings: number;
      option_text: string;
      option_description: string;
    }[];
  };
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  metacritic?: {
    score: number;
    url: string;
  };
  categories?: {
    id: number;
    description: string;
  }[];
  genres?: {
    id: number;
    description: string;
  }[];
  screenshots?: {
    id: number;
    path_thumbnail: string;
    path_full: string;
  }[];
  movies?: {
    id: number;
    name: string;
    thumbnail: string;
    webm: {
      '480': string;
      max: string;
    };
    highlight: boolean;
  };
  recommendations?: {
    total: number;
  };
  achievements?: {
    total: number;
    highlighted: {
      name: string;
      path: string;
    }[];
    release_date: {
      coming_soon: boolean;
      date: string;
    };
  };
}

interface PlayerSummariesResponse extends AxiosResponse {
  data: {
    response: {
      players: PlayerSummary[];
    };
  };
}

interface OwnedGamesResponse extends AxiosResponse {
  data: {
    response: {
      game_count: number;
      games: {
        appid: number;
        playtime_forever: number;
      }[];
    };
  };
}

interface AppDetailsResponse extends AxiosResponse {
  data: Record<string, {
    success: boolean;
    data: AppDetails;
  }>;
}

enum ResolveVanityURLSucceeded {
  Yes = 1,
  No = 42,
}

interface ResolveVanityURLResponse extends AxiosResponse {
  data: {
    response: {
      success: ResolveVanityURLSucceeded;
      steamid?: string;
      message?: string;
    };
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

  public static async GetAppDetails(appid: string, filters: string[] = []): Promise<AppDetails> {
    const {
      data: {
        [appid]: {
          success,
          data: details,
        },
      },
    }: AppDetailsResponse = await bigpicture.get('/appdetails/', {
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
    }: OwnedGamesResponse = await this.steampowered.get('/IPlayerService/GetOwnedGames/v1/', {
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
    }: PlayerSummariesResponse = await this.steampowered.get('/ISteamUser/GetPlayerSummaries/v2/', {
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
    }: ResolveVanityURLResponse = await this.steampowered.get('/ISteamUser/ResolveVanityURL/v1/', {
      params: { vanityurl: profile },
    });

    if (success === ResolveVanityURLSucceeded.Yes) {
      return steamid as string;
    }

    // success === 42
    throw Error(message);
  }
}
