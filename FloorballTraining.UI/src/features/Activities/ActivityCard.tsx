import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import { Link } from "react-router-dom";
import type {Activity} from "../../app/models/Activity.ts";

type Props = {
    activity: Activity;
}
export default function ActivityCard({activity}: Props) {

        
    return (
        <Card elevation={3} sx={{width: 250, height:250, backgroundSize:'cover', borderRadius: 3, display:'flex-wrap', flexDirection: 'row', justifyContent: 'space-between'}} key={activity.id}>

            <CardContent>
                <Typography gutterBottom variant="h5" component="div">{activity.name}</Typography>
                {/*<Tags tags={getTrainingGoals(training)} />*/}
            </CardContent>


            <CardActions sx={{justifyContent: 'space-between'}}>
                <Button>PDF</Button>
                <Button component={Link} to={`/activities/${activity.id}`}>Detail</Button>

            </CardActions>

        </Card>
    );
}





