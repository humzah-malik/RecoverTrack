import React from 'react';
import { Slider, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

interface RangeFieldProps {
  label: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

// Styled Slider with custom theme
const CustomSlider = styled(Slider)(({ theme }) => ({
  color: '#000',
  height: 4,
  '& .MuiSlider-thumb': {
    height: 20,
    width: 20,
    backgroundColor: '#fff',
    border: '2px solid #000',
    '&:hover': {
      boxShadow: '0 0 0 8px rgba(0,0,0,0.1)',
    },
  },
  '& .MuiSlider-track': {
    backgroundColor: '#000',
  },
  '& .MuiSlider-rail': {
    opacity: 0.3,
    backgroundColor: '#000',
  },
  '& .MuiSlider-valueLabel': {
    backgroundColor: '#000',
    color: '#fff',
    borderRadius: '4px',
    fontWeight: 600,
  },
}));

export default function RangeField({
    label,
    name,
    value,
    onChange,
    min = 1,
    max = 5,
    step = 1,
    disabled = false, // <- Add default
  }: RangeFieldProps) {
    return (
      <Box mt={6} mb={2} opacity={disabled ? 0.6 : 1}> 
        <Typography
          variant="body2"
          fontWeight={600}
          color="text.primary"
          mb={0.5}
          textAlign="left"
        >
          {label}
        </Typography>
        <CustomSlider
          name={name}
          value={value}
          onChange={(_, newValue) => {
            if (!disabled) onChange(newValue as number);
          }}
          min={min}
          max={max}
          step={step}
          marks
          valueLabelDisplay="auto"
          aria-label={label}
          disabled={disabled}
        />
      </Box>
    );
  }