
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SlidersHorizontal, Palette, Undo } from 'lucide-react';
import { useThemeColor } from '@/components/providers/theme-color-provider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const ColorPicker = () => {
    const { primaryColor, setPrimaryColor, resetToDefault } = useThemeColor();
    const { theme } = useTheme();

    const [currentColor, setCurrentColor] = useState('');

    useEffect(() => {
        const getEffectiveColor = () => {
            if (primaryColor) {
                return primaryColor;
            }
            if (typeof window !== 'undefined') {
                const style = getComputedStyle(document.documentElement);
                const primaryCssVar = style.getPropertyValue('--primary').trim();
                if (primaryCssVar) {
                    const [h, s, l] = primaryCssVar.split(' ').map(parseFloat);
                    return hslToHex(h, s, l);
                }
            }
            // Fallback to CSS variables from globals.css if everything else fails
            return theme === 'dark' ? hslToHex(0, 0, 98) : hslToHex(11, 72, 58);
        };
        
        setCurrentColor(getEffectiveColor());

    }, [primaryColor, theme]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setCurrentColor(newColor);
        setPrimaryColor(newColor);
    };
    
    const handleReset = () => {
        resetToDefault();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Theme Customization</CardTitle>
                <CardDescription>
                    Choose a custom primary color for the application. This will be saved across sessions.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <div className="relative">
                            <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="primary-color"
                                type="text"
                                value={currentColor}
                                onChange={handleColorChange}
                                className="pl-10"
                            />
                            <Input
                                type="color"
                                value={currentColor}
                                onChange={handleColorChange}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10 p-1 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
                <Button onClick={handleReset} variant="outline" size="sm">
                    <Undo className="mr-2 h-4 w-4" />
                    Reset to Default
                </Button>
            </CardContent>
        </Card>
    );
};

// Function to convert HSL to Hex
function hslToHex(h: number, s: number, l: number) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; }
    else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; }
    else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; }
    else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; }
    else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; }
    else if (300 <= h && h < 360) { [r, g, b] = [c, 0, x]; }
    const toHex = (c: number) => ('0' + Math.round(c * 255).toString(16)).slice(-2);
    return `#${toHex(r + m)}${toHex(g + m)}${toHex(b + m)}`;
}

export default function SystemConfigurationPage() {

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <SlidersHorizontal className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">System Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Configure system-wide settings and parameters.
          </p>
        </div>
      </div>
      <ColorPicker />
    </div>
  );
}
