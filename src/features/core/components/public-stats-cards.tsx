"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileCode, 
  Terminal, 
  Globe, 
  Tags, 
  Award, 
  Eye, 
  EyeOff, 
  Share2, 
  History, 
  UserPlus, 
  FileText,
  Sparkles
} from "lucide-react";
import type { PublicStats } from "@/features/core/utils/stats";

interface PublicStatsCardsProps {
  stats: PublicStats;
}

export function PublicStatsCards({ stats }: PublicStatsCardsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalVisibility = (stats.visibility.public + stats.visibility.shared + stats.visibility.private) || 1;
  const publicPercent = (stats.visibility.public / totalVisibility) * 100;
  const sharedPercent = (stats.visibility.shared / totalVisibility) * 100;
  const privatePercent = (stats.visibility.private / totalVisibility) * 100;

  // Primary Metrics
  const primaryCards = [
    {
      icon: FileCode,
      label: "Total Snippets",
      value: mounted ? stats.totalSnippets.toLocaleString() : "0",
      description: "Active snippets in database",
      colorClass: "text-emerald-400",
      gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      borderColor: "hover:border-emerald-500/20",
    },
    {
      icon: Terminal,
      label: "Lines of Code",
      value: mounted ? stats.totalLines.toLocaleString() : "0",
      description: "Sum of all code files",
      colorClass: "text-blue-400",
      gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
      borderColor: "hover:border-blue-500/20",
    },
    {
      icon: Globe,
      label: "Languages Used",
      value: mounted ? stats.totalLanguages.toLocaleString() : "0",
      description: "Distinct languages compiled",
      colorClass: "text-indigo-400",
      gradient: "from-indigo-500/15 via-indigo-500/5 to-transparent",
      borderColor: "hover:border-indigo-500/20",
    },
    {
      icon: Tags,
      label: "Different Tags",
      value: mounted ? stats.totalDifferentTags.toLocaleString() : "0",
      description: "Unique tags categorized",
      colorClass: "text-amber-400",
      gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
      borderColor: "hover:border-amber-500/20",
    },
  ];

  // Language Breakdown
  const languageBreakdown = stats.languagesBreakdown.slice(0, 6) ?? [];
  const maxLanguageCount = languageBreakdown.length > 0 ? Math.max(...languageBreakdown.map((l) => l.count)) : 1;

  return (
    <div className="space-y-8">
      {/* Premium Glassmorphic Intro Card */}
      <Card className="overflow-hidden border border-white/5 bg-card/45 backdrop-blur-md shadow-2xl relative">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        
        <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold tracking-wider uppercase text-primary">
              <Sparkles size={12} className="animate-pulse" />
              Live Dashboard
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              KoalaSnippets Platform Insights
            </h2>
            <p className="text-muted-foreground max-w-xl text-sm md:text-base leading-relaxed">
              Explore dynamic workspace metrics, coding statistics, language distributions, and repository visibility of our self-hosted community.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 border border-white/5 bg-background/45 backdrop-blur-sm p-4 rounded-xl shadow-inner w-full md:w-auto text-center sm:text-left">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <Users size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {mounted ? stats.totalUsers.toLocaleString() : "0"}
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Active Creators
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {primaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.label} 
              className={`overflow-hidden border border-white/5 bg-card/60 backdrop-blur-md shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-default ${card.borderColor}`}
            >
              <CardContent className="p-6 relative">
                <div className={`absolute right-0 top-0 w-24 h-24 bg-gradient-to-br ${card.gradient} rounded-bl-full opacity-60 pointer-events-none`} />
                <div className="space-y-4 relative z-10">
                  <div className={`inline-flex p-3 rounded-xl bg-background/80 border border-white/5 ${card.colorClass}`}>
                    <Icon size={24} suppressHydrationWarning />
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-extrabold tracking-tight tabular-nums">
                      {card.value}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {card.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Language Breakdown Bar Chart */}
        <Card className="lg:col-span-7 border border-white/5 bg-card/50 backdrop-blur-md shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Globe size={18} className="text-indigo-400" />
                  Language Distribution
                </CardTitle>
                <CardDescription>
                  Most utilized languages by file count
                </CardDescription>
              </div>
              <Badge variant="secondary" className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center gap-1">
                <Award size={14} />
                Most Used: {stats.popularLanguage}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {languageBreakdown.length > 0 ? (
              <div className="space-y-4">
                {languageBreakdown.map((lang) => (
                  <div key={lang.language} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground capitalize tracking-wide">
                        {lang.language}
                      </span>
                      <span className="text-muted-foreground font-mono tabular-nums bg-background/60 px-2 py-0.5 rounded border border-white/5">
                        {lang.count} {lang.count === 1 ? "file" : "files"}
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500/70 to-purple-500/70 rounded-full transition-all duration-500"
                        style={{ width: `${(lang.count / maxLanguageCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No languages analyzed yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visibility Distribution & Platform Micro-metrics */}
        <Card className="lg:col-span-5 border border-white/5 bg-card/50 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Eye size={18} className="text-blue-400" />
              Slight-of-Hand Visibility
            </CardTitle>
            <CardDescription>
              Access structures for all active snippets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
            {/* Stacked Horizontal Segmented Progress Bar */}
            <div className="space-y-4">
              <div className="h-3.5 w-full bg-muted/40 rounded-full overflow-hidden flex border border-white/5 shadow-inner">
                {stats.visibility.public > 0 && (
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                    style={{ width: `${publicPercent}%` }}
                    title={`Public: ${stats.visibility.public}`}
                  />
                )}
                {stats.visibility.shared > 0 && (
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                    style={{ width: `${sharedPercent}%` }}
                    title={`Shared: ${stats.visibility.shared}`}
                  />
                )}
                {stats.visibility.private > 0 && (
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                    style={{ width: `${privatePercent}%` }}
                    title={`Private: ${stats.visibility.private}`}
                  />
                )}
                {totalVisibility === 0 && (
                  <div className="h-full w-full bg-muted transition-all" />
                )}
              </div>

              {/* Legends Row */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="space-y-1 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center justify-center gap-1.5 font-semibold text-emerald-400">
                    <Eye size={12} />
                    <span>Public</span>
                  </div>
                  <p className="font-extrabold text-foreground tabular-nums">{stats.visibility.public}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">({mounted ? publicPercent.toFixed(0) : "0"}%)</p>
                </div>
                
                <div className="space-y-1 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center justify-center gap-1.5 font-semibold text-blue-400">
                    <Share2 size={12} />
                    <span>Shared</span>
                  </div>
                  <p className="font-extrabold text-foreground tabular-nums">{stats.visibility.shared}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">({mounted ? sharedPercent.toFixed(0) : "0"}%)</p>
                </div>

                <div className="space-y-1 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center justify-center gap-1.5 font-semibold text-amber-400">
                    <EyeOff size={12} />
                    <span>Private</span>
                  </div>
                  <p className="font-extrabold text-foreground tabular-nums">{stats.visibility.private}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">({mounted ? privatePercent.toFixed(0) : "0"}%)</p>
                </div>
              </div>
            </div>

            {/* Micro Metrics List */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-muted/40 text-muted-foreground border border-white/5">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Avg Snippet Size</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {mounted ? stats.averageLines.toLocaleString() : "0"} lines
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-muted/40 text-muted-foreground border border-white/5">
                  <UserPlus size={16} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Lifetime Users</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {mounted ? stats.totalUsersCreated.toLocaleString() : "0"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-muted/40 text-muted-foreground border border-white/5">
                  <History size={16} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Lifetime Snippets</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {mounted ? stats.totalSnippetsCreated.toLocaleString() : "0"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-muted/40 text-muted-foreground border border-white/5">
                  <FileCode size={16} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active Files</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {mounted ? stats.languagesBreakdown.reduce((sum, l) => sum + l.count, 0).toLocaleString() : "0"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
