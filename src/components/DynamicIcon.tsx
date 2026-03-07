import * as LucideIcons from "lucide-react";

interface DynamicIconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function DynamicIcon({ name, size = 24, className = "" }: DynamicIconProps) {
  // @ts-expect-error dynamic typing
  const IconComponent = LucideIcons[name] || LucideIcons.HelpCircle;
  return <IconComponent size={size} className={className} />;
}
