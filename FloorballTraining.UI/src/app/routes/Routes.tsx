import {createBrowserRouter} from "react-router-dom";
import App from "../layout/App.tsx";
import ActivitiesList from "../../features/Activities/ActivitiesList.tsx";
import AppointmentsList from "../../features/Appointments/AppointmentsList.tsx";
import MembersList from "../../features/Members/MembersList.tsx";
import TrainingsList from "../../features/Trainings/TrainingsList.tsx";
import TeamsList from "../../features/Teams/TeamsList.tsx";
import Login from "../../features/Login/Login.tsx";
import Register from "../../features/Register/Register.tsx";
import {TrainingDetail} from "../../features/Trainings/TrainingDetail.tsx";
import ActivityDetail from "../../features/Activities/ActivityDetail.tsx";
import Drawing from "../../features/Drawings/Drawing.tsx";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {path: "", element: <Drawing/>},
            
            /*Trainings*/
            {path: "/trainings", element: <TrainingsList/>},
            {path: "/trainings/:id", element: <TrainingDetail/>},
            
            /*Activities*/
            {path: "/activities", element: <ActivitiesList/>},
            {path: "/activities/:id", element: <ActivityDetail/>},
            
            /*Appointments*/
            {path: "/appointments", element: <AppointmentsList/>},

            /*Appointments*/
            {path: "/drawings", element: <Drawing/>},
            
            
                                /*MASTER DATA*/
            /*Teams*/
            {path: "/teams", element: <TeamsList/>},
            
            /*Members*/
            {path: "/members", element: <MembersList/>},
            
            /*Authentication*/
            {path: "/login", element: <Login/>},
            {path: "/register", element: <Register/>},
            ]
    }
])