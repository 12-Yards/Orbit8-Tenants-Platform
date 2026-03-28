import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface InsiderTipProps {
  title: string;
  tip: string;
  author?: string;
}

export function InsiderTip({ title, tip, author }: InsiderTipProps) {
  return (
    <Card className="bg-primary/5 border-primary/20" data-testid="insider-tip">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground">{tip}</p>
            {author && (
              <p className="text-xs text-muted-foreground mt-2">
                — {author}, Local Insider
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
