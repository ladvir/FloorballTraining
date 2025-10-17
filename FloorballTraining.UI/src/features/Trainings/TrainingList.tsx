import {Fragment} from "react";
import type {AgeGroup} from "../../app/models/AgeGroup.ts";
import { Typography } from "@mui/material";

type Props = {
    ageGroups: AgeGroup[];
    
}

export default function TrainingList({ageGroups}: Props) {
    return (
        <Fragment>
            <Typography variant={"h4"}>Age Groups</Typography>
            <ul>
                {ageGroups.map(ageGroup =>  (
                        
                            <li key={ageGroup.id}>{ageGroup.name} - {ageGroup.description}</li>
                        
                    ))}
        </ul>
        </Fragment>
    )
}