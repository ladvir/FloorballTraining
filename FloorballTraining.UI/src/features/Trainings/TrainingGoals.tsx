import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

import type {TrainingGoal} from "../../app/models/TrainingGoal.ts";


type Props = {
    trainingGoals: TrainingGoal[]
}

export default function TrainingGoals({trainingGoals}: Props) {
    return (
      

                        <Stack direction="row" spacing={1}>
                            <Chip label={trainingGoals[0].name} />
                            {trainingGoals[1] && (<Chip label={trainingGoals[1]?.name}/>)}
                            {trainingGoals[2] && (<Chip label={trainingGoals[2]?.name}/>)}
                        </Stack>

    );
}

