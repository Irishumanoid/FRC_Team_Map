import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import Box from '@mui/material/Box';
import { Checkbox, IconButton, Stack, TextField, Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { AddressData, DrpData, Team } from './JsonInterfaces';
import { useEffect, useState } from 'react';
import { SortedList }  from './SortedList';
import { TeamDesc } from './TeamDesc';

interface MapProps {
  width?: number,
  height?: number,
  teams?: AddressData | null,
}

const getDistToTeamKm = (lat: number, long: number, teamNumber: number, addresses: AddressData | null) => {
  if (addresses) {
    const teamData: AddressData = addresses;

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
  return 0.0;
}

const findNearbyTeams = (searchRadiusKm: number, lat: number, lng: number, addresses: AddressData | null) => {
  let validTeams: Map<string, number> = new Map();
  if (addresses) {
    const teamData: AddressData = addresses;
    Object.keys(teamData).forEach((teamNumber) => {
      const dist = getDistToTeamKm(lat, lng, Number(teamNumber), addresses);
      if (dist && dist <= searchRadiusKm) {
        validTeams.set(teamNumber, dist);
      }
    });
  }
  return validTeams;
}

const useDistances = (lat: number, lng: number, teamData: DrpData | null, addresses: AddressData | null) => {
  const [dists, setDists] = useState<Map<string, number> | null>(null);
  useEffect(() => { 
    if (teamData && addresses) {
      const distanceMap = new Map<string, number>();
      for (const teamNumber in Object.keys(teamData)) {
        const dist = getDistToTeamKm(lat, lng, Number(teamNumber), addresses);
        if (dist !== null) {
          distanceMap.set(teamNumber, dist);
        }
      }
      setDists(distanceMap);
    }
  }, [lat, lng, teamData, addresses]);
  return dists;
}

const useTeamRanks = (teamData: {} | null) => {
  const [ranks, setRanks] = useState<Map<string, number> | null>(null);
  useEffect(() => {
    if (teamData) {
      const dataMap = new Map(Object.entries(teamData).map(([teamNumber, drp]) => [String(teamNumber), Number(drp)]));
      setRanks(dataMap);
    }
  }, [teamData]);
  return ranks;
}

const sortTeamsByDist = (dists: Map<string, number>) => {
  const maxDist = Math.max(...Array.from(dists.values()));
  const newProxList: [string, number][] = Array.from(dists.entries())
    .map(([teamNumber, dist]) => [teamNumber, 1 - dist / maxDist]);
  newProxList.sort((a, b) => b[1] - a[1]);
  return newProxList;
}

export const MapDisplay = ({width=100, height=100, teams}: MapProps) => {
const gMapsKey: string = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: gMapsKey });
const[teamData, setTeamData] = useState<DrpData | null>(null);
const [addresses, setAddresses] = useState<AddressData | null>(null);
const [lat, setLat] = useState(39.8283);
const [lng, setLng] = useState(-98.5795);
const [useProx, setUseProx] = useState(false);
const [useRank, setUseRank] = useState(false);
const [proxList, setProxList] = useState<[string, number][]>([]);
const [rankList, setRankList] = useState<[string, number][]>([]);
const dists = useDistances(lat, lng, teamData, addresses);
const ranks = useTeamRanks(teamData);
const [markerState, setMarkerState] = useState({number: "", name: "", address: "",});
const [teamClicked, setTeamClicked] = useState(false);
const [searchRadius, setSearchRadius] = useState(0.0);


useEffect(() => {
  (async () => {
    try {
      const response = await fetch('/teams_drp.json');
      const data = await response.json();
      console.log(`fetched team data:`, data);
      setTeamData(data);
    } catch (error) {
      console.error("Error fetching team data:", error);
    }
  })();
}, []);

useEffect(() => {
  (async () => {
    try {
      const response = await fetch('/team_addresses_w_codes.json');
      const data = await response.json();
      console.log("Fetched address data:", data);
      setAddresses(data);
    } catch (error) {
      console.error("Error fetching team addresses:", error);
    }
  })();
}, []);


if (loadError) return (
    <Box>
      <Typography> Loading... </Typography>
    </Box>
);

const handleMarkerClick = (teamNumber: string, name: string, address: string, lat: number, lng: number) => {
  console.log(`Clicked on ${name} with address ${address}`);
  setMarkerState({number: teamNumber, name: name, address: address});
  setTeamClicked(true);
  setLat(lat);
  setLng(lng);
}

useEffect(() => {
  console.log(`search radius is ${searchRadius}`);
  if (searchRadius != 0.0) {
    const teams = findNearbyTeams(searchRadius, lat, lng, addresses)
    const newProxList = sortTeamsByDist(teams);
    setProxList(newProxList);
  } else {
    const teamsByDists = dists;
    if (teamsByDists != null) {
      setProxList(sortTeamsByDist(teamsByDists));
    }
  }
}, [searchRadius]);

useEffect(() => {
  if (useProx && dists) {
      const newProxList = sortTeamsByDist(dists);
      setProxList(newProxList);
  }
}, [useProx, dists]);

useEffect(() => {
  if (useRank && ranks) {
    const maxRank = Math.max(...Array.from(ranks.values()));
    const newRankList: [string, number][] = Array.from(ranks.entries()).map(
      ([teamNumber, dist]) => [teamNumber, dist / maxRank]);
    newRankList.sort((a, b) => b[1] - a[1]);
    setRankList(newRankList);
  }
}, [useRank, ranks]);

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
  <Stack>
      <GoogleMap
      zoom={10}
      center={{lat: lat, lng: lng}}
      mapContainerStyle={{ width: `${width}px`, height: `${height}px`}}
      onClick={(e) => {
        setLat(e.latLng?.lat ?? 0.0); 
        setLng(e.latLng?.lng ?? 0.0);
        setTeamClicked(false);
      }}
    >
      {!teamClicked && <Marker 
        position={{ lat, lng }} 
        icon={{
          url: "here.png", 
          scaledSize: new google.maps.Size(60, 60), 
        }} />
      }
      {teamArray.map(([teamId, team]) => {
        const lat = team.geocode?.lat;
        const lng = team.geocode?.lng;
        if (typeof lat !== "number" || typeof lng !== "number") {
          console.warn(`Invalid coordinates for team ${teamId}: lat=${lat}, lng=${lng}`);
          return null;
        }

        return (
          <Marker
            key={teamId}
            position={{ lat, lng }}
            onClick={() => handleMarkerClick(teamId, team.name, team.address as string, lat, lng)}
          />
        );
      })}
    </GoogleMap>
    <Stack direction="row" paddingTop={2}>
      <Typography paddingTop={1.7}>Use prox</Typography>
      <Checkbox onChange={() => {
        setUseProx(!useProx);
        }}/>
      <Typography paddingTop={1.8}>Use DRP</Typography>
      <Checkbox onChange={() => setUseRank(!useRank)}/>
      <Typography paddingTop={2} paddingLeft={55}>Set search radius (km) </Typography>
      <TextField
        sx={{ width: 110, paddingLeft: 4 }}
        type="number"
        inputProps={{ min: 0 , max: 20037 }}
        value={searchRadius}
        onChange={(e) => {
          setSearchRadius(Number(e.target.value));
        }}
        />
      <IconButton edge="end" aria-label="delete" onClick={() => setSearchRadius(0.0)}>
          <ClearIcon/>
      </IconButton>
    </Stack>
    <Stack direction="row">
      {(useProx && proxList.length != 0) && <SortedList inputs={proxList} title="Teams by Proximity" dense={false}/>}
      {(useRank && rankList.length != 0) && <SortedList inputs={rankList} title="Teams by DRP" dense={false}/>}
      {(markerState.number != "" && markerState.name != "" && markerState.address != "" && teamClicked) 
      && <TeamDesc name={markerState.name} number={markerState.number} address={markerState.address}/>}
    </Stack>
  </Stack>
);
}