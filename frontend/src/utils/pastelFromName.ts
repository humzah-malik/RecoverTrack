// src/utils/pastelFromName.ts
export function pastelFromName(name = '') {
     if (!name) return '#E5E7EB';
     const hue = (name.charCodeAt(0) * 37) % 360;
     return `hsl(${hue} 70% 90%)`;
   }