import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import Box from '@mui/material/Box';
import { Checkbox, Stack, Typography } from '@mui/material';
import { Data } from './JsonInterfaces';
import { useEffect, useState } from 'react';
import { SortedList }  from './SortedList';
import { TeamDesc } from './TeamDesc';

interface MapProps {
  width?: number,
  height?: number,
  teams?: Data | null,
}

  const getDistToTeamKm = async (lat: number, long: number, teamNumber: number) => {
    const response = await fetch('/team_addresses_w_codes.json');
    const teamData: Data = await response.json();
    

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

  const useDistances = (lat: number, lng: number) => {
    const [dists, setDists] = useState<Map<string, number> | null>(null);
    // so distance calculations can be updated without violating react hook rules
    useEffect(() => { 
      const fetchDistances = async () => {
        try {
            const response = await fetch('/teams_drp.json');
            const data = await response.json();
            const distanceMap = new Map<string, number>();
            for (const teamNumber in Object.keys(data)) {
              const dist = await getDistToTeamKm(lat, lng, Number(teamNumber));
              if (dist !== null) {
                distanceMap.set(teamNumber, dist);
              }
            }
            setDists(distanceMap);
        } catch (error) {
          console.error("error updating team distances: ", error);
        }
      }
      fetchDistances();
    }, [lat, lng]);
    return dists;
  }

  const useTeamRanks = () => {
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
  }

export const MapDisplay = ({width=100, height=100, teams}: MapProps) => {
  const gMapsKey: string = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: gMapsKey });
  const [lat, setLat] = useState(39.8283);
  const [lng, setLng] = useState(-98.5795);
  const [useProx, setUseProx] = useState(false);
  const [useRank, setUseRank] = useState(false);
  const [proxList, setProxList] = useState<[string, number][]>([]);
  const [needsReset, setNeedsReset] = useState(false);
  const [rankList, setRankList] = useState<[string, number][]>([]);
  const dists = useDistances(lat, lng);
  const ranks = useTeamRanks();
  const [markerState, setMarkerState] = useState({number: "", name: "", address: "",});
  const [teamClicked, setTeamClicked] = useState(false);
  

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
    if (needsReset) {
      window.location.reload();
      setNeedsReset(false)
    }
  }, [needsReset]);

  useEffect(() => {
    if (useProx && dists) {
        const maxDist = Math.max(...Array.from(dists.values()));
        const newProxList: [string, number][] = Array.from(dists.entries()).map(
          ([teamNumber, dist]) => [teamNumber, 1 - dist / maxDist]);
        newProxList.sort((a, b) => b[1] - a[1]); // sort by 2nd tuple element
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
        {!teamClicked && <Marker position={{ lat, lng }} icon={{
          url: "here.png", 
          scaledSize: new google.maps.Size(60, 60), 
        }} />}
        {teamArray.map(([teamId, team]) => (
          <Marker
            key={teamId}
            position={{ lat: team.geocode.lat, lng: team.geocode.lng }}
            onClick={() => handleMarkerClick(teamId, team.name, team.address as string, team.geocode.lat, team.geocode.lng)}
          />
        ))}
      </GoogleMap>
      <Stack direction="row">
        <Typography>Use prox</Typography>
        <Checkbox onChange={() => {
          setUseProx(!useProx);
          if (useProx) {
            setNeedsReset(true);
          }
          }}/>
        <Typography>Use DRP</Typography>
        <Checkbox onChange={() => setUseRank(!useRank)}/>
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