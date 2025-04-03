import { IconButton, List, ListItem, ListItemText, Pagination, Stack, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { ChangeEvent, useEffect, useState } from "react";

interface SortedListProps {
    inputs: [string, number][],
    title: string,
    dense: boolean,
}

export const SortedList = ({ inputs: initInputs, title, dense }: SortedListProps) => {
    const numPerPage = 10;
    const [pagination, setPagination] = useState({
        from: 0,
        to: numPerPage,
    });
    const [inputs, setInputs] = useState<[string, number][]>(initInputs);

    useEffect(() => {
        setInputs(initInputs);
    }, [initInputs]);

    const handlePageChange = (event: ChangeEvent<unknown>, page: number) => {
        if (event) {
            const from = (page - 1) * numPerPage;
            const to = from + numPerPage;
            setPagination({ from: from, to: to });
        }
    }

    const deleteElement = (id: string) => {
        setInputs((prevInputs) => prevInputs.filter(([name]) => name !== id));
    }

    return (
        <Stack>
            <Typography> {title} </Typography>
            <List dense={dense}>
            {inputs.slice(pagination.from , pagination.to).map(([name, number]) => (
                <ListItem
                    key={name} 
                    secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => deleteElement(name)}>
                            <DeleteIcon/>
                        </IconButton>
                    }>
                    <ListItemText primary={`team ${name}`} secondary={`normalized score: ${number.toPrecision(3)}`} />
                </ListItem>
            ))}
         </List>
         <Pagination count={Math.ceil(inputs.length / numPerPage)} onChange={handlePageChange}/>
        </Stack>   
    );
}