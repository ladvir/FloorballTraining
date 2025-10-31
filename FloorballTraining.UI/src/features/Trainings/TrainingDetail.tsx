import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import type {Training} from "../../app/models/Training.ts";

import {Box} from "@mui/material";

export function TrainingDetail() {
    const {id} = useParams<{ id: string }>();

    const [training, setTraining] = useState<Training | null>(null);

    useEffect(() => {
        fetch(`https://localhost:5210/trainings/${id}`)
            .then(response => response.json())
            .then(data => setTraining(data))
            .catch(error => console.log(error));

    }, [id])

    return (
        <Box>

            <div>TrainingDetail</div>

            <h1>{training?.name}</h1>

        </Box>
    )
} 