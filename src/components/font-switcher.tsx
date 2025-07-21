"use client"

import * as React from "react"
import { Check, Text } from "lucide-react"
import { useFont } from "@/components/font-provider"
import type { Font } from "@/components/font-provider"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

type FontDefinition = { name: string; value: Font; family: string };

export function FontSwitcher() {
  const { font, setFont } = useFont()

  const fonts: { name: string; value: Font; family: string }[] = [
    { name: "PT Sans", value: "pt-sans", family: "var(--font-pt-sans)" },
    { name: "Lato", value: "lato", family: "var(--font-lato)" },
    { name: "Open Sans", value: "open-sans", family: "var(--font-open-sans)" },
    { name: "Montserrat", value: "montserrat", family: "var(--font-montserrat)" },
    { name: "Merienda", value: "merienda", family: "var(--font-merienda)" },
    { name: "Bad Script", value: "bad-script", family: "var(--font-bad-script)" },
    { name: "Caveat", value: "caveat", family: "var(--font-caveat)" },
    { name: "Playfair Display", value: "playfair-display", family: "var(--font-playfair-display)" },
    { name: "Lobster", value: "lobster", family: "var(--font-lobster)" },
    { name: "Pacifico", value: "pacifico", family: "var(--font-pacifico)" },
  ];
  
  const professionalFonts = fonts.slice(1, 4);
  const handwrittenFonts = fonts.slice(4, 7);
  const fancyFonts = fonts.slice(7, 10);
  
  const selectedFont = fonts.find(f => f.value === font) || fonts[0];

  const renderFontMenuItem = (f: FontDefinition) => (
    <DropdownMenuItem key={f.value} onClick={() => setFont(f.value)}>
      <span style={{ fontFamily: f.family }}>{f.name}</span>
      {font === f.value && <Check className="ml-auto h-4 w-4" />}
    </DropdownMenuItem>
  );

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Font</h3>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
             <Text className="h-5 w-5 mr-2" />
             <span style={{ fontFamily: selectedFont.family }}>{selectedFont.name}</span>
            <span className="sr-only">Toggle font</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
          <DropdownMenuLabel>Default</DropdownMenuLabel>
          {renderFontMenuItem(fonts[0])}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Professional</DropdownMenuLabel>
          {professionalFonts.map(renderFontMenuItem)}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Handwritten</DropdownMenuLabel>
          {handwrittenFonts.map(renderFontMenuItem)}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Fancy</DropdownMenuLabel>
          {fancyFonts.map(renderFontMenuItem)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
