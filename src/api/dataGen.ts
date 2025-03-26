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

  getDistToTeam(lat: number, long: number, teamNumber: number): number | null {
    const data: Record<string, TeamAddress> = JSON.parse(
      fs.readFileSync("team_addresses_w_codes.json", "utf-8")
    );

    if (!data[teamNumber]) {
      console.log(`Team ${teamNumber} not found`);
      return null;
    }

    const team = data[teamNumber];

    if (
      typeof team.geocode === "string" ||
      !("lat" in team.geocode) ||
      !("lng" in team.geocode)
    ) {
      console.log("Invalid geocode for team, cannot calculate distance.");
      return null;
    }

    const R = 6371; 
    const dLat = ((team.geocode.lat - lat) * Math.PI) / 180;
    const dLng = ((team.geocode.lng - long) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((team.geocode.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}