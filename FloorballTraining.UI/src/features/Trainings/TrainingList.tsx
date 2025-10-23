import {Box, Typography} from "@mui/material";
import TrainingCard from "./TrainingCard.tsx";
import type {Training} from "../../app/models/Training.ts";

type Props = {
    trainings: Training[];    
}

export default function TrainingList({trainings}: Props) {
    return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Typography variant={"h4"}>Trainings</Typography>
            {trainings.map(training => (
                <TrainingCard key={training.id}  training={training} />
            ))}
            
        </Box>
    )
}