import { Stack, Typography } from "@mui/material";

interface TeamDetails {
    name: string,
    number: string,
    address: string
}
export const TeamDesc = ({name, number, address}: TeamDetails) => {
    return (
        <Stack>
            <Typography> {name} </Typography>
            <Typography> {number} </Typography>
            <Typography> {address} </Typography>
        </Stack>
    );
}