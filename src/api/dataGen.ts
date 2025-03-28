import fetch from "node-fetch";
import { Client } from "@googlemaps/google-maps-services-js";
import * as fs from "fs";

interface TeamData {
  team_number: number;
  nickname: string;
  school_name?: string;
  city?: string;
  state_prov?: string;
  postal_code?: string;
  country?: string;
}

interface TeamAddress {
  name: string;
  address: string | null;
  geocode: { lat: number; lng: number } | string;
}

export class TbaFetcher {
  private gMapsKey: string;
  private maps: Client;
  private tbaKey: string;

  constructor(gMapsKey: string, tbaKey: string) {
    this.gMapsKey = gMapsKey;
    this.maps = new Client({});
    this.tbaKey = tbaKey;
  }

  async getResult(endpoint: string): Promise<any> {
    const response = await fetch(
      `https://www.thebluealliance.com/api/v3/${endpoint}`,
      {
        headers: { "X-TBA-Auth-Key": this.tbaKey },
      }
    );
    return response.json();
  }

  private read(data: any, key: string): string {
    return data[key] !== null && data[key] !== undefined ? data[key] : "";
  }

  private makeTeamAddress(data: TeamData): string | null {
    const addr = [
      this.read(data, "school_name"),
      this.read(data, "city"),
      this.read(data, "state_prov"),
      this.read(data, "postal_code"),
      this.read(data, "country"),
    ]
      .filter((s) => s !== "")
      .join(" ");

    return addr.length > 0 ? addr : null;
  }

  async getAllTeams(): Promise<void> {
    let allTeamsJson: Record<string, any[]> = {};
    let i = 0;
    let curRes: any[] = [""];

    while (curRes.length !== 0) {
      curRes = await this.getResult(`teams/${i}`);
      allTeamsJson[`page ${i}`] = curRes;
      i++;
    }

    fs.writeFileSync("teams.json", JSON.stringify(allTeamsJson, null, 4));
  }

  async getAllAddresses(): Promise<void> {
    let teamObj: Record<string, TeamAddress> = {};
    
    const data = JSON.parse(fs.readFileSync("teams.json", "utf-8"));
    
    for (const page in data) {
      for (const team of data[page]) {
        const number = this.read(team, "team_number");
        const name = this.read(team, "nickname");
        const address = this.makeTeamAddress(team);
        let geocode: { lat: number; lng: number } | string = "Invalid address";

        if (address) {
          try {
            const geoRes = await this.maps.geocode({
              params: { address, key: this.gMapsKey },
            });

            if (geoRes.data.results.length > 0) {
              geocode = geoRes.data.results[0].geometry.location;
              console.log(`Address found for team ${number}:`, geocode);
            }
          } catch (error) {
            console.log(`Could not geocode address for team ${team.key}`);
          }
        }

        teamObj[number] = { name, address, geocode };
      }
    }

    fs.writeFileSync(
      "team_addresses_w_codes.json",
      JSON.stringify(teamObj, null, 4)
    );
  }

  async getTeamDrps(year: number): Promise<void> {
    const teamDrpMap = new Map();
    const events = await this.getResult(`events/${year}/keys`);

    for (const index in events) {
      const results = await this.getResult(`event/${events[index]}/rankings`);
      const rankings = results.rankings || [];

      for (const index in rankings) {
        const drp = this.read(rankings[index], 'extra_stats')[0];
        const teamCode = this.read(rankings[index], 'team_key');
        const teamNumber = teamCode.substring(3, teamCode.length);
        console.log(`found drp of ${drp} for team ${teamNumber}`);
        
        if (teamDrpMap.has(teamNumber)) {
          teamDrpMap.set(teamNumber, (teamDrpMap.get(teamNumber) || 0) + drp);
        } else {
          teamDrpMap.set(teamNumber, drp);
        }
      }
    }

    fs.writeFileSync("teams_drp.json", JSON.stringify(Object.fromEntries(teamDrpMap), null, 4));
  }
}
