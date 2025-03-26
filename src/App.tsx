import { Box, Typography } from '@mui/material';
import './App.css';
import { MapDisplay } from './components/MapDisplay';
import { useEffect, useState } from 'react';

interface TeamAddress {
  name: string;
  address: string | null;
  geocode: {
    lat: number, 
    lng: number
  };
}

interface Data {
  [key: string]: TeamAddress;
}

const App = () => {
  const [teamData, setTeamData] = useState<Data | null>(null);

  useEffect(() => {
    fetch('/team_addresses_w_codes.json') 
      .then((response) => response.json())
      .then((data) => setTeamData(data))
      .catch((error) => console.error("Error extracting team data: ", error));
  }, []);

  if (!teamData) {
    return (
      <Box>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const teamMap = new Map();
  Object.keys(teamData).forEach((teamId) => {
    const team = teamData[teamId];
    const lat = team.geocode.lat;
    const lng = team.geocode.lng;
    teamMap.set(teamId, [lat, lng]);
  });

  return (
    <>
      <div>
        <MapDisplay width={1000} height={600} teams={teamMap} />
      </div>
      <p className="info">Map of all active FRC teams</p>
    </>
  );
};

export default App;
