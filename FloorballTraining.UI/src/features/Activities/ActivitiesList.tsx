import { Box, Typography } from "@mui/material";
import ActivityCard from "./ActivityCard.tsx";
import {useEffect, useState} from "react";
import type {Activity} from "../../app/models/Activity.ts";

export default function ActivitiesList() {
    const [trainings, setTrainings] = useState<Activity[]>([]);

    useEffect(() => {
        fetch('https://localhost:5210/activities')
            .then(response => response.json())
            .then(data => setTrainings(data.data))
    }, []);

    return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Typography variant={"h4"}>Activities</Typography>
            {trainings.map(activity => (
                <ActivityCard key={activity.id}  activity={activity} />
            ))}

        </Box>
    )
}