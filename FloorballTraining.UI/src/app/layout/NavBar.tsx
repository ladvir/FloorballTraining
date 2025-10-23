import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import {ListItem, Switch} from "@mui/material";
import {NavLink} from "react-router-dom";

const pages = [
    {title:'Trainings', path:"/trainings"}, 
    { title:'Activities',path:'/activities'},
    {title:'Appointments',path:'/appointments'}, 
    {title:'Teams',path:'/teams'}, 
    {title:'Members',path:'/members'} ];

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

interface NavBarProps {
    toggleDarkMode: () => void,
    darkMode:  boolean
}

export function NavBar({toggleDarkMode, darkMode}: NavBarProps) {
    const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

       
    return (
        <AppBar position="fixed">
            <Container sx={{width: '100vw !important'}}>
                <Toolbar disableGutters>
                    <Switch checked={darkMode}
                            onChange={toggleDarkMode}
                            slotProps={{ input: { 'aria-label': 'controlled' } }} />

                    {pages.map(({title, path}) => (
                        <ListItem component={NavLink}
                            to={path}
                            key={path}
                                  sx={{color:'inherit', typography: 'h6'}}
                        >  {title}</ListItem>
                    ))}
                    
                    
                   
                    {/*<Box sx={{flexGrow: 0}}>*/}
                    {/*    <Tooltip title="Open settings">*/}
                    {/*        <IconButton onClick={handleOpenUserMenu} sx={{p: 0}}>*/}
                    {/*            <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg"/>*/}
                    {/*        </IconButton>*/}
                    {/*    </Tooltip>*/}
                    {/*    <Menu*/}
                    {/*        sx={{mt: '45px'}}*/}
                    {/*        id="menu-appbar"*/}
                    {/*        anchorEl={anchorElUser}*/}
                    {/*        anchorOrigin={{*/}
                    {/*            vertical: 'top',*/}
                    {/*            horizontal: 'right',*/}
                    {/*        }}*/}
                    {/*        keepMounted*/}
                    {/*        transformOrigin={{*/}
                    {/*            vertical: 'top',*/}
                    {/*            horizontal: 'right',*/}
                    {/*        }}*/}
                    {/*        open={Boolean(anchorElUser)}*/}
                    {/*        onClose={handleCloseUserMenu}*/}
                    {/*    >*/}
                    {/*        {settings.map((setting) => (*/}
                    {/*            <MenuItem key={setting} onClick={handleCloseUserMenu}>*/}
                    {/*                <Typography sx={{textAlign: 'center'}}>{setting}</Typography>*/}
                    {/*            </MenuItem>*/}
                    {/*        ))}*/}
                    {/*    </Menu>*/}
                    {/*</Box>*/}
                </Toolbar>
            </Container>
        </AppBar>
    );
}

