import { GoogleMap, useLoadScript, Marker} from '@react-google-maps/api';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import { Data } from './JsonInterfaces';
import { useEffect, useState } from 'react';


interface MapProps {
  width?: number,
  height?: number,
  teams?: Data | null,
}

  const getDistToTeamKm = (lat: number, long: number, teamNumber: number) => {
    const [teamData, setTeamData] = useState<Data | null>(null);
    
    useEffect(() => {
        fetch('/team_addresses_w_codes.json') 
          .then((response) => response.json())
          .then((data) => setTeamData(data))
          .catch((error) => console.error("Error extracting team data: ", error));
      }, []);

    if (!teamData || !teamData[teamNumber]) {
      console.log(`Team ${teamNumber} not found`);
      return null;
    }

    const team = teamData[teamNumber];
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

  /*const getDistances = (lat: number, long: number) => {
    const [dists, setDists] = useState<Map<string, number> | null>(null);
    useEffect(() => {
      fetch('/teams_drp.json')
      .then(response => response.json())
      .then((data) => {
        const distanceMap = new Map(
          Object.keys(data)
            .map((teamNumber) => [teamNumber, getDistToTeamKm(lat, long, Number(teamNumber))])
            .filter((entry): entry is [string, number] => entry !== null));
        setDists(distanceMap);
      }).catch((error) => console.error("Error fetching team distance data", error));
    }, []);
    return dists;
  }

  const getTeamRanks = () => {
    const [ranks, setRanks] = useState<Map<string, number> | null>(null);
    useEffect(() => {
      fetch('/teams_drp.json')
      .then(response => response.json())
      .then((data) => {
        const dataMap = new Map(Object.entries(data).map(([teamNumber, drp]) => [String(teamNumber), Number(drp)]));
        setRanks(dataMap);
      }).catch((error) => console.error("Error fetching team rank data", error));
    }, []);
    return ranks;
  }*/

export const MapDisplay = ({width=100, height=100, teams}: MapProps) => {
  const gMapsKey: string = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: gMapsKey });
  //const [useProx, setUseProx] = useState(false);
  //const [useRank, setUseRank] = useState(false);
  
  if (loadError) return (
      <Box>
        <Typography> Loading... </Typography>
      </Box>
  );

  if (!isLoaded) {
    return <div>Loading maps</div>;
  }

  const teamMap = new Map();
  if (teams) {
    Object.keys(teams).forEach((teamId) => {
      const team = teams[teamId];
      const lat = team.geocode.lat;
      const lng = team.geocode.lng;
      teamMap.set(teamId, [lat, lng]);
    });
  }

  const teamArray = teams ? Object.entries(teams) : [];
  return (
    <GoogleMap
      zoom={10}
      center={{ lat: 40.7128, lng: -74.0060 }}
      mapContainerStyle={{ width: `${width}px`, height: `${height}px`}}
    >
      {teamArray.map(([teamId, team]) => (
        <Marker
          key={teamId}
          position={{ lat: team.geocode.lat, lng: team.geocode.lng }}
          onClick={() => console.log(`Clicked on ${team.name} with address ${team.address}`)}
        />
      ))}
    </GoogleMap>
  );
}