import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export function SnippetSkeleton() {
  return (
    <Card className="flex flex-col h-[280px] bg-card/50 border-border/50 animate-pulse">
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
        <div className="space-y-2 w-full">
          <div className="h-5 w-2/3 bg-muted rounded-md" />
          <div className="h-4 w-1/3 bg-muted rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pt-0 mt-2">
        <div className="h-full bg-muted/50 rounded-md border border-border/20 p-4 space-y-2">
          <div className="h-3 w-5/6 bg-muted rounded-full" />
          <div className="h-3 w-4/6 bg-muted rounded-full" />
          <div className="h-3 w-3/6 bg-muted rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between items-center text-xs">
        <div className="flex gap-2">
          <div className="h-5 w-12 bg-muted rounded-full" />
          <div className="h-5 w-16 bg-muted rounded-full" />
        </div>
        <div className="h-4 w-20 bg-muted rounded-md" />
      </CardFooter>
    </Card>
  );
}
