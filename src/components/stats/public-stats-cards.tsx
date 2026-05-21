"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, FileCode } from "lucide-react";

interface PublicStatsCardsProps {
  totalUsersCreated: number;
  totalSnippetsCreated: number;
}

export function PublicStatsCards({ totalUsersCreated, totalSnippetsCreated }: PublicStatsCardsProps) {
  const cards = [
    {
      icon: Users,
      label: "Total Users Created",
      value: totalUsersCreated.toLocaleString(),
      gradient: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      icon: FileCode,
      label: "Total Snippets Created",
      value: totalSnippetsCreated.toLocaleString(),
      gradient: "from-success/10 to-success/5",
      iconColor: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="overflow-hidden">
            <CardContent className="p-0">
              <div className={`bg-gradient-to-br ${card.gradient} p-8 text-center space-y-4`}>
                <div className={`inline-flex p-3 rounded-full bg-background/80 ${card.iconColor}`}>
                  <Icon size={32} suppressHydrationWarning />
                </div>
                <p className="text-5xl font-bold tracking-tight">{card.value}</p>
                <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
