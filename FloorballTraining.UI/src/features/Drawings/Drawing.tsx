import {Box} from "@mui/material";
import DrawingComponent from "./DrawingComponent.tsx";

export default function Drawing() {
    return (
        <Box>
            <div     id="drawingApp"> Drawing</div>  
            
            <DrawingComponent/>
    </Box>
        
    )
}