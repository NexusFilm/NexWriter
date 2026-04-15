export type LightingRead = 'high-key' | 'low-key' | 'balanced';
export type ContrastRead = 'high' | 'medium' | 'low';
export type PaletteRead = 'warm' | 'cool' | 'neutral' | 'vivid';
export type SettingRead = 'interior' | 'exterior' | 'mixed';

export interface VisualAnalysis {
  lighting: LightingRead;
  contrast: ContrastRead;
  palette: PaletteRead;
  setting: SettingRead;
  brightness: number;
  contrastScore: number;
  saturation: number;
  analyzed: boolean;
}

const FALLBACK_ANALYSIS: VisualAnalysis = {
  lighting: 'balanced',
  contrast: 'medium',
  palette: 'neutral',
  setting: 'mixed',
  brightness: 0.5,
  contrastScore: 0.18,
  saturation: 0.22,
  analyzed: false,
};

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  if (max === gn) h = (bn - rn) / d + 2;
  if (max === bn) h = (rn - gn) / d + 4;

  return { h: h * 60, s, l };
}

function classifyLighting(brightness: number, contrastScore: number): LightingRead {
  if (brightness >= 0.64 && contrastScore <= 0.24) return 'high-key';
  if (brightness <= 0.38) return 'low-key';
  return 'balanced';
}

function classifyContrast(contrastScore: number): ContrastRead {
  if (contrastScore >= 0.25) return 'high';
  if (contrastScore <= 0.13) return 'low';
  return 'medium';
}

function classifyPalette(avgSaturation: number, warmPixels: number, coolPixels: number): PaletteRead {
  const totalColorPixels = warmPixels + coolPixels;
  if (avgSaturation >= 0.48 && totalColorPixels > 24) return 'vivid';
  if (avgSaturation <= 0.16 || totalColorPixels < 10) return 'neutral';
  return warmPixels >= coolPixels ? 'warm' : 'cool';
}

function classifySetting(brightness: number, saturation: number, palette: PaletteRead): SettingRead {
  if (brightness >= 0.58 && saturation >= 0.2 && palette !== 'neutral') return 'exterior';
  if (brightness <= 0.5 || palette === 'warm' || palette === 'neutral') return 'interior';
  return 'mixed';
}

export async function analyzeImageUrl(url: string): Promise<VisualAnalysis> {
  if (typeof document === 'undefined') return FALLBACK_ANALYSIS;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.decoding = 'async';

  const loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Unable to analyze image'));
  });

  img.src = url;
  await loaded;

  const canvas = document.createElement('canvas');
  const size = 48;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return FALLBACK_ANALYSIS;

  context.drawImage(img, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;

  const luminanceValues: number[] = [];
  let luminanceSum = 0;
  let saturationSum = 0;
  let warmPixels = 0;
  let coolPixels = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const { h, s } = rgbToHsl(r, g, b);

    luminanceValues.push(luminance);
    luminanceSum += luminance;
    saturationSum += s;

    if (s > 0.18 && (h <= 70 || h >= 335)) warmPixels += 1;
    if (s > 0.18 && h >= 170 && h <= 265) coolPixels += 1;
  }

  const sampleCount = luminanceValues.length || 1;
  const brightness = luminanceSum / sampleCount;
  const saturation = saturationSum / sampleCount;
  const variance = luminanceValues.reduce((sum, value) => sum + (value - brightness) ** 2, 0) / sampleCount;
  const contrastScore = Math.sqrt(variance);
  const palette = classifyPalette(saturation, warmPixels, coolPixels);

  return {
    lighting: classifyLighting(brightness, contrastScore),
    contrast: classifyContrast(contrastScore),
    palette,
    setting: classifySetting(brightness, saturation, palette),
    brightness,
    contrastScore,
    saturation,
    analyzed: true,
  };
}

export function getFallbackAnalysis(): VisualAnalysis {
  return FALLBACK_ANALYSIS;
}
