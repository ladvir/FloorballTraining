import {createBrowserRouter} from "react-router-dom";
import App from "../layout/App.tsx";
import ActivitiesList from "../../features/Activities/ActivitiesList.tsx";
import AppointmentsList from "../../features/Appointments/AppointmentsList.tsx";
import MembersList from "../../features/Members/MembersList.tsx";
import TrainingsList from "../../features/Trainings/TrainingsList.tsx";
import TeamsList from "../../features/Teams/TeamsList.tsx";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {path: "", element: <MembersList/>},
            {path: "/trainings", element: <TrainingsList/>},
            {path: "/activities", element: <ActivitiesList/>},
            {path: "/appointments", element: <AppointmentsList/>},
            {path: "/teams", element: <TeamsList/>},
            {path: "/members", element: <MembersList/>},
            ]
    }
])