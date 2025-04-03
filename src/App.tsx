import { Box, Typography } from '@mui/material';
import './App.css';
import { MapDisplay } from './components/MapDisplay';
import { useEffect, useState } from 'react';
import { AddressData } from './components/JsonInterfaces';

const App = () => {
  const [teamData, setTeamData] = useState<AddressData | null>(null);

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

  return (
    <>
     <p className="info">Map of all active FRC teams</p>
      <div>
        <MapDisplay width={1000} height={600} teams={teamData} />
      </div>
    </>
  );
};

export default App;
