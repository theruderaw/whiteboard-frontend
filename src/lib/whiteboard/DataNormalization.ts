export const normalizePoints = (raw: any): number[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    // Case 1: Direct standard numeric flat array [x,y,x,y]
    if (typeof raw[0] === 'number') return raw;
    // Case 2: Legacy object array [{x,y}, {x,y}]
    if (typeof raw[0] === 'object' && raw[0] !== null) {
      const res: number[] = [];
      for (let i = 0; i < raw.length; i++) {
        if (raw[i] && typeof raw[i].x === 'number') res.push(raw[i].x, raw[i].y);
      }
      return res;
    }
  }
  // Case 3: Legacy double-stringified JSON
  if (typeof raw === 'string') {
    try { return normalizePoints(JSON.parse(raw)); } catch { return []; }
  }
  return [];
};

export const normalizeStroke = (rawStroke: any) => {
  const type = rawStroke.type || 'stroke';
  const data = rawStroke.data || {};
  
  // 1. Points extraction
  const points = normalizePoints(data.points);
  
  // 2. Color Validation (CRITICAL VISIBILITY SAFEGUARD)
  let color = data.color;
  const isEraser = type === 'erase' || data.isEraser === true;
  
  if (isEraser) {
    color = '#000000'; // Safe default for underlying mask
  } else {
    // Catch legacy invisibility states
    const isInvisible = !color || color === 'transparent' || color === 'rgba(0,0,0,0)' || color === '#000000'; 
    // Auto-promote to standard user-visible fallback pink if caught hiding
    if (isInvisible) {
      color = '#ee2689'; 
    }
  }

  // 3. LineWidth Safeguard
  let lineWidth = parseFloat(data.lineWidth);
  if (isNaN(lineWidth) || lineWidth <= 0) {
    lineWidth = 20; // Guarantee non-zero thickness
  }

  return {
    type: isEraser ? 'erase' : 'stroke',
    data: {
      points,
      color,
      lineWidth,
      isEraser
    }
  };
};
