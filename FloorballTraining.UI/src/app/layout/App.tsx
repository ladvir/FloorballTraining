import { useEffect, useState } from 'react';
import './styles.css'
import Container from "@mui/material/Container";
import {NavBar} from "./NavBar.tsx";
import {Box, createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import { Outlet } from "react-router-dom";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored ? stored === 'true' : false;
  });
  
  
  const palleteType = darkMode ? 'dark' : 'light';
  
  const theme = createTheme({  
      palette: {
            mode: palleteType,
          background: {
                default: palleteType === 'light' ? '#eaeaea' : '#121212'
          }
      }
  });
  
  

  // Uložení darkMode do localStorage při změně
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);  
  };
  
  return (      
      <ThemeProvider theme={theme}>
          <CssBaseline/>
          <NavBar toggleDarkMode={toggleDarkMode} darkMode={darkMode}/>
          <Box sx={{ minHeight:'100vh', background: darkMode ? '#121212' : '#eaeaea' }}>
              <Container sx={{ mt: 8 }}>        
              <Outlet/>    
              </Container>    
          </Box>
      </ThemeProvider>   
  );
}