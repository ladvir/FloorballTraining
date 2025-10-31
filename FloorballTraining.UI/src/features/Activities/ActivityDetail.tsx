import { Box } from "@mui/material";
import {useEffect, useState} from "react";
import type {Activity} from "../../app/models/Activity.ts";
import {useParams} from "react-router-dom";

export default function ActivityDetail() {
    const {id} = useParams<{ id: string }>();

    const [activity, setActivity] = useState<Activity | null>(null);

    useEffect(() => {
        fetch(`https://localhost:5210/activities/${id}`)
            .then(response => response.json())
            .then(data => setActivity(data))
            .catch(error => console.log(error));

    }, [id])

    return (
        <Box>

            <div>TrainingDetail</div>

            <h1>{activity?.name}</h1>

        </Box>
    )
}

 
