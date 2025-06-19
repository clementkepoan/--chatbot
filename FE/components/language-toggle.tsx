"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/lib/i18n"

export function LanguageToggle() {
  const { language, toggleLanguage, isEnglish } = useLanguage()

  const handleToggle = () => {
    toggleLanguage()
  }

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="language-toggle" className="text-sm font-medium text-brand-black">
        {isEnglish ? "EN" : "中文"}
      </Label>
      <Switch
        id="language-toggle"
        checked={!isEnglish} // Checked when language is Chinese (zh-TW)
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-brand-red data-[state=unchecked]:bg-gray-300"
        thumbClassName="data-[state=checked]:bg-white data-[state=unchecked]:bg-white"
      />
    </div>
  )
}
