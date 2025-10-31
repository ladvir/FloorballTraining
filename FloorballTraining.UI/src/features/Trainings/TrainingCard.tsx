import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';


import {getTrainingGoals, type Training} from "../../app/models/Training.ts";

import TrainingGoals from "./TrainingGoals.tsx";
import { Link } from "react-router-dom";


type Props = {
    training: Training;    
}

function TrainingCard({training}: Props) {
    return (
        <Card elevation={3} sx={{width: 250, height:250, backgroundSize:'cover', borderRadius: 3, display:'flex-wrap', flexDirection: 'row', justifyContent: 'space-between'}} key={training.id}>
                          
                <CardContent>
                    <Typography gutterBottom variant="h5" component="div">{training.name}</Typography>
                    <TrainingGoals trainingGoals={getTrainingGoals(training)} />
                </CardContent>

            
            <CardActions sx={{justifyContent: 'space-between'}}>
                <Button>PDF</Button>
                <Button component={Link} to={`/trainings/${training.id}`}>Detail</Button>
                
            </CardActions>
            
        </Card>
    );
}

export default TrainingCard
