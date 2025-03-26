import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';


interface MapProps {
  width?: number,
  height?: number,
  teams?: Map<number, [number, number]>,
}

export const MapDisplay = ({width=100, height=100, teams=new Map()}: MapProps) => {
  const gMapsKey: string = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: gMapsKey });
  
  if (loadError) return (
      <Box>
        <Typography> Loading... </Typography>
      </Box>
  );

  return (
    <GoogleMap
      zoom={10}
      center={{ lat: 40.7128, lng: -74.0060 }}
      mapContainerStyle={{ width: `${width}px`, height: `${height}px`}}
    >
      {Array.from(teams.entries()).map(([teamId, [lat, lng]]) => (
        <Marker key={teamId} position={{ lat, lng }} onClick={() => console.log("hi")}/>
      ))}
    </GoogleMap>
  );
}