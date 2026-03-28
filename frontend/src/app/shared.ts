import {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  DollarSign,
  GraduationCap,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

export type Tone = "blue" | "green" | "purple" | "orange";
export type IconName =
  | "Award"
  | "BarChart3"
  | "BookOpen"
  | "Brain"
  | "Briefcase"
  | "Building2"
  | "DollarSign"
  | "GraduationCap"
  | "Target"
  | "TrendingUp"
  | "Users";

export interface HeroSection {
  badge: string;
  title: string;
  description: string;
  actionLabel: string;
  searchPlaceholder?: string;
  chips?: string[];
}

export const iconMap = {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  DollarSign,
  GraduationCap,
  Target,
  TrendingUp,
  Users,
};

export const toneClasses: Record<Tone, { surface: string; text: string; soft: string; badge: string; logo: string }> = {
  blue: {
    surface: "bg-blue-600 text-white border-blue-600 shadow-lg",
    text: "text-blue-600",
    soft: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    logo: "bg-blue-600",
  },
  green: {
    surface: "bg-green-600 text-white border-green-600 shadow-lg",
    text: "text-green-600",
    soft: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-700",
    logo: "bg-green-600",
  },
  purple: {
    surface: "bg-purple-600 text-white border-purple-600 shadow-lg",
    text: "text-purple-600",
    soft: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    logo: "bg-purple-600",
  },
  orange: {
    surface: "bg-orange-600 text-white border-orange-600 shadow-lg",
    text: "text-orange-600",
    soft: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    logo: "bg-orange-600",
  },
};
