import React from 'react';
import { SvgIcon } from '@mui/material';

// Este componente se comportará IGUAL que cualquier icono de MUI
// Puedes usarle color="primary", fontSize="large", sx={{...}}, etc.
const CowIcon = (props) => {
  return (
   <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Silueta Oficial de Vaca (Material Design Community) */}
      <path d="M20,13V19H17V17H7V19H4V13C4,13 4,9 9,9H12C12.8,9 13.5,9.2 14.2,9.6L20,13M12,5H7C5.5,5 4.5,5.6 4.1,6.5L2.8,9.2C2.3,10.3 3,11.5 4.1,11.8C4.3,11.9 4.5,11.9 4.7,11.9C5.6,11.9 6.4,11.4 6.7,10.6L7.3,9H12L13.5,12L14.7,11.3L12,5Z" />
    </SvgIcon>
  );
};

export default CowIcon;