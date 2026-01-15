import React from 'react';
import { SvgIcon } from '@mui/material';

// Este componente se comportará IGUAL que cualquier icono de MUI
// Puedes usarle color="primary", fontSize="large", sx={{...}}, etc.
const CowIcon = (props) => {
  return (
   <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M 123 170 C 108.24 170.4 103.87 175.17 92.25 180.81 C 80.62 186.45 87.51 204.41 98.08 206.87 C 108.65 209.33 120.18 216.87 134.75 213.76 C 149.33 210.65 153.77 211.16 164.75 203.75 C 175.74 196.34 168.95 181 158.77 177.58 C 148.59 174.15 137.75 169.6 123 170 M 115 192 C 120.42 196.91 116.23 204.59 109 203 C 106.72 201.62 108.76 198.85 106 199 C 106.72 193.17 110.2 191.94 115 192 M 147 192 C 152.42 196.91 148.23 204.59 141 203 C 138.72 201.62 140.76 198.85 138 199 C 138.72 193.17 142.2 191.94 147 192 Z" />
    </SvgIcon>
  );
};

export default CowIcon;