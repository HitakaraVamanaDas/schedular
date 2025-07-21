"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Check, Sun, Moon, Laptop } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const themes = [
    { name: "Light", value: "light", icon: Sun },
    { name: "Dark", value: "dark", icon: Moon },
    { name: "System", value: "system", icon: Laptop },
  ]

  const CurrentIcon = React.useMemo(() => {
    if (!mounted) return Laptop;
    // Use resolvedTheme for displaying the correct icon when theme is 'system'
    if (theme === 'system') {
        return resolvedTheme === 'dark' ? Moon : Sun;
    }
    return theme === "dark" ? Moon : Sun
  }, [mounted, theme, resolvedTheme])


  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Theme</h3>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
             {mounted ? <CurrentIcon className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themes.map((t) => (
            <DropdownMenuItem key={t.value} onClick={() => setTheme(t.value)}>
              <t.icon className="mr-2 h-4 w-4" />
              <span>{t.name}</span>
              {theme === t.value && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
