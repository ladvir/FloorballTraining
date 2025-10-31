import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import {List, ListItem, Switch, Typography} from "@mui/material";
import {NavLink} from "react-router-dom";

const mainFeatures = [
    {title:'Trainings', path:"/trainings"}, 
    {title:'Activities',path:'/activities'},
    {title:'Appointments',path:'/appointments'},
    {title:'Drawing',path:'/drawings'}];

const masterDataFeatures = [
    {title:'Tags', path:"/tags"},
    {title:'Equipments', path:"/equipments"},
    {title:'Teams',path:'/teams'},
    {title:'Members',path:'/members'} ];

const userFeatures = [
    {title:'Profile', path:"/user-profile"},
    {title:'Register', path:"/register"},
    {title:'Login',path:'/login'},
    {title:'Logout',path:'/logout'}];

const navBarStyles = {textDecoration:'none',
    '&:hover': {color: 'grey.500'},
    '&.active': {color: 'secondary.main'},

    color:'inherit', typography: 'h6'};

interface NavBarProps {
    toggleDarkMode: () => void,
    darkMode:  boolean
}

export function NavBar({toggleDarkMode, darkMode}: NavBarProps) {

    
    return (
        <AppBar position="fixed">
                            <Toolbar sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    
                   
                        <Box>
                            <Typography sx={navBarStyles} component={NavLink} to={"/"}>FloTr</Typography>
                            <Switch checked={darkMode} onChange={toggleDarkMode} slotProps={{ input: { 'aria-label': 'controlled' } }} />
                        </Box>
                    <List sx={{display:'flex'}}>
                    {mainFeatures.map(({title, path}) => (
                        <ListItem component={NavLink}
                            to={path}
                            key={path} 
                                  sx={navBarStyles}
                        >  {title}</ListItem>
                    ))}
                        </List>

                    <List sx={{display:'flex'}}>
                    {masterDataFeatures.map(({title, path}) => (
                        <ListItem component={NavLink}
                                  to={path}
                                  key={path}
                                  sx={navBarStyles}
                        >  {title}</ListItem>
                    ))}
                    </List>
                    <List sx={{display:'flex'}}>
                    {userFeatures.map(({title, path}) => (
                        <ListItem component={NavLink}
                                  to={path}
                                  key={path}
                                  sx={navBarStyles}
                        >  {title}</ListItem>
                    ))}
                        
                    </List>
                </Toolbar>
            
        </AppBar>
    );
}

