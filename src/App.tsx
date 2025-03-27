import { Box, Typography } from '@mui/material';
import './App.css';
import { MapDisplay } from './components/MapDisplay';
import { useEffect, useState } from 'react';
import { Data } from './components/JsonInterfaces';

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

  return (
    <>
      <div>
        <MapDisplay width={1000} height={600} teams={teamData} />
      </div>
      <p className="info">Map of all active FRC teams</p>
    </>
  );
};

export default App;
