import { type ChangeEvent } from "react";
import { BookOpen, Brain, DollarSign, Play, Search, Target } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import type { CareerItem, StudentDashboard } from "./types";

interface StudentDashboardViewProps {
  dashboard: StudentDashboard;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  searchLoading: boolean;
  searchResults: CareerItem[] | null;
}

export default function StudentDashboardView({
  dashboard,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchLoading,
  searchResults,
}: StudentDashboardViewProps) {
  const careers = searchResults ?? dashboard.careers.items;

  return (
    <div className="space-y-6">
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-700 via-fuchsia-700 to-indigo-700 text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-4 flex items-start gap-2">
            <Brain className="h-6 w-6 text-yellow-300" />
            <Badge className="border border-fuchsia-300/40 bg-fuchsia-500/20 text-fuchsia-100">{dashboard.hero.badge}</Badge>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">{dashboard.hero.title}</h1>
          <p className="mb-6 text-base text-fuchsia-100/90 sm:text-lg">{dashboard.hero.description}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex w-full flex-1 items-center gap-2 rounded-lg border border-white/20 bg-white/95 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchQueryChange(event.target.value)}
                placeholder={dashboard.hero.searchPlaceholder}
                className="h-auto border-0 p-0 text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button size="lg" onClick={onSearch} className="min-h-11 w-full bg-white text-purple-700 hover:bg-purple-50 sm:w-auto" disabled={searchLoading}>
              {searchLoading ? "Exploring..." : dashboard.hero.actionLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.careers.title}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">{dashboard.careers.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {careers.length === 0 && <p className="text-sm text-slate-400">No career paths matched your search.</p>}
            {careers.map((career) => (
              <Card key={career.title} className="overflow-hidden border border-white/10 bg-white/[.03] transition-all hover:-translate-y-0.5 hover:border-fuchsia-300/20 hover:bg-white/[.06] hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400/30 to-pink-400/30 text-4xl">{career.icon}</div>
                  <h3 className="mb-2 text-lg font-bold text-white">{career.title}</h3>
                  <div className="space-y-1 text-sm text-slate-300">
                    <p className="flex items-center justify-center gap-1">
                      <DollarSign className="h-4 w-4" /> {career.salary}
                    </p>
                    <p className="flex items-center justify-center gap-1">{career.duration} education</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.advisor.title}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">{dashboard.advisor.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/10 bg-white/[.03] p-6">
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="mb-2 font-semibold text-slate-100">What are you interested in?</p>
                <div className="flex flex-wrap gap-2">
                  {dashboard.advisor.interests.map((interest) => (
                    <Badge key={interest} className="cursor-pointer border border-purple-300/40 bg-purple-500/15 text-purple-100 hover:bg-purple-500/25">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button className="min-h-11 w-full bg-purple-600 hover:bg-purple-700">{dashboard.advisor.actionLabel}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.pathway.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.pathway.steps.map((step, index) => (
              <div key={step.title} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[.03] p-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30">
                  <span className="font-bold text-fuchsia-200">{index + 1}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{step.title}</p>
                  <p className="text-sm text-slate-300">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.resources.title}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">{dashboard.resources.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {dashboard.resources.items.map((resource) => (
              <div key={resource.title} className="group relative overflow-hidden rounded-lg">
                <img src={resource.imageUrl} alt={resource.alt} className="h-48 w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                    <Play className="ml-1 h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">{resource.title}</p>
                  <p className="text-sm text-white/80">{resource.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}