import React from 'react';
import { SvgIcon } from '@mui/material';

// Este componente se comportará IGUAL que cualquier icono de MUI
// Puedes usarle color="primary", fontSize="large", sx={{...}}, etc.
const CowIcon = (props) => {
  return (
    <SvgIcon {...props}>
      {/* Esta ruta dibuja una cabeza de vaca estilo Material Design */}
      <path d="M17,6C16.4,6 15.9,6.1 15.4,6.4L12,3L8.6,6.4C8.1,6.1 7.6,6 7,6C4.8,6 3,7.8 3,10V16C3,18.2 4.8,20 7,20C8.4,20 9.7,19.3 10.4,18.2L12,19L13.6,18.2C14.3,19.3 15.6,20 17,20C19.2,20 21,18.2 21,16V10C21,7.8 19.2,6 17,6M8,12C7.4,12 7,11.6 7,11C7,10.4 7.4,10 8,10C8.6,10 9,10.4 9,11C9,11.6 8.6,12 8,12M16,12C15.4,12 15,11.6 15,11C15,10.4 15.4,10 16,10C16.6,10 17,10.4 17,11C17,11.6 16.6,12 16,12M7,15V17L5,16V14L7,15M17,17V15L19,14V16L17,17Z" />
    </SvgIcon>
  );
};

export default CowIcon;