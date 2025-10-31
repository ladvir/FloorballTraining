import {Box, Typography} from "@mui/material";
import TrainingCard from "./TrainingCard.tsx";
import type {Training} from "../../app/models/Training.ts";
import {useEffect, useState} from "react";

export default function TrainingsList() {
    const [trainings, setTrainings] = useState<Training[]>([]);

    useEffect(() => {
        fetch('https://localhost:5210/trainings')
            .then(response => response.json())
            .then(data => setTrainings(data.data))
    }, []);
    
    return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Typography variant={"h4"}>Trainings</Typography>
            {trainings.map(training => (
                <TrainingCard key={training.id}  training={training} />
            ))}
            
        </Box>
    )
}