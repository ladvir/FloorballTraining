
import { useEffect, useState } from 'react';
import './styles.css'
import type {AgeGroup} from "../models/AgeGroup.ts";
import TrainingList from "../../features/Trainings/TrainingList.tsx";
import Container from "@mui/material/Container";

function App() {
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  useEffect(() => {
    fetch('https://localhost:5210/agegroups')
      .then(response => response.json())
      .then(data => setAgeGroups(data.data))
  }, []);


  return (      
    <Container maxWidth={"xl"}>
      
        <TrainingList ageGroups = {ageGroups}/>      
    </Container>
  );
}

export default App
