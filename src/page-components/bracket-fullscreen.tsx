"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useGetEventByIdQuery, useGetEventBracketQuery, useGetEventTeamsQuery, useGetEventEntriesQuery, useGetGroupMembersQuery } from "@/store/api";
import { Button } from "@/components/ui/button";
import { Trophy, GitBranch, Plus, Minus, X } from "lucide-react";

export default function BracketFullscreenPage() {
  const { eventId } = useParams();
  const [bracketZoom, setBracketZoom] = useState(1);

  const { data: eventData } = useGetEventByIdQuery(eventId as string, { skip: !eventId });

  const { data: bracketData } = useGetEventBracketQuery(eventId as string, { skip: !eventId });

  const { data: competitionTeams = [] } = useGetEventTeamsQuery(eventId as string, { skip: !eventId });

  const { data: competitionEntries = [] } = useGetEventEntriesQuery(eventId as string, { skip: !eventId });

  const { data: groupMembers = [] } = useGetGroupMembersQuery(eventData?.groupId as string, { skip: !eventData?.groupId });

  const getTeamPlayerNames = (team: any) => {
    if (!team) return [];
    const slots = [team.player1EntryId, team.player2EntryId, team.player3EntryId, team.player4EntryId, team.player5EntryId, team.player6EntryId].filter(Boolean);
    return slots.map((slotId: string) => {
      if (!slotId) return null;
      const [entryId, slotIndexStr] = slotId.split(':');
      const slotIndex = parseInt(slotIndexStr, 10);
      const entry = competitionEntries.find(e => e.id === entryId);
      if (!entry) return null;
      
      if (slotIndex === 0) {
        const member = groupMembers?.find(m => m.userId === entry.userId);
        return member?.name || entry.playerNames?.[0] || entry.teamName || "Player";
      } else {
        const assignedUserId = entry.assignedPlayerIds?.[slotIndex - 1];
        if (assignedUserId) {
          const member = groupMembers?.find(m => m.userId === assignedUserId);
          return member?.name || entry.playerNames?.[slotIndex] || "Player";
        }
        return entry.playerNames?.[slotIndex] || "Player";
      }
    }).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            {eventData?.title || "Competition Bracket"}
          </h1>
          <p className="text-muted-foreground text-sm">Full Screen Bracket View</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Zoom: {Math.round(bracketZoom * 100)}%</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setBracketZoom(z => Math.max(0.25, z - 0.25))}
              disabled={bracketZoom <= 0.25}
              data-testid="button-fullscreen-zoom-out"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBracketZoom(1)}
              data-testid="button-fullscreen-zoom-reset"
            >
              Reset
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setBracketZoom(z => Math.min(2, z + 0.25))}
              disabled={bracketZoom >= 2}
              data-testid="button-fullscreen-zoom-in"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.close()}
            data-testid="button-close-fullscreen"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {!bracketData?.bracket ? (
        <div className="text-center py-16">
          <GitBranch className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Bracket Yet</h3>
          <p className="text-muted-foreground">The competition bracket hasn't been created yet.</p>
        </div>
      ) : (
        <div className="overflow-auto border rounded-lg bg-muted/20" style={{ height: 'calc(100vh - 120px)' }}>
          <div 
            className="flex gap-8 min-w-max p-6 origin-top-left transition-transform"
            style={{ transform: `scale(${bracketZoom})` }}
          >
            {bracketData.rounds.map((round, roundIndex) => {
              const roundMatches = bracketData.matches
                .filter(m => m.roundId === round.id)
                .sort((a, b) => a.matchNumber - b.matchNumber);
              const matchHeight = 240;
              const gap = 24;
              const baseUnit = matchHeight + gap;
              const spacing = baseUnit * Math.pow(2, roundIndex);
              const topOffset = roundIndex === 0 ? 0 : (baseUnit * (Math.pow(2, roundIndex) - 1)) / 2;
              
              return (
                <div key={round.id} className="flex flex-col">
                  <h4 className="font-semibold text-base text-center mb-4 whitespace-nowrap sticky top-0 bg-muted/80 py-2 px-4 rounded">
                    {round.roundName}
                  </h4>
                  <div 
                    className="flex flex-col" 
                    style={{ 
                      gap: `${spacing - matchHeight}px`,
                      marginTop: `${topOffset}px`
                    }}
                  >
                    {roundMatches.map(match => {
                      const team1 = competitionTeams.find(t => t.id === match.team1Id);
                      const team2 = competitionTeams.find(t => t.id === match.team2Id);
                      const team1Players = getTeamPlayerNames(team1);
                      const team2Players = getTeamPlayerNames(team2);
                      const hasTeams = team1 || team2;
                      
                      return (
                        <div 
                          key={match.id} 
                          className="border rounded-lg p-3 w-64 bg-card overflow-hidden"
                          style={{ height: `${matchHeight}px` }}
                          data-testid={`fullscreen-bracket-match-${match.id}`}
                        >
                          <div className="mb-2">
                            <span className="text-sm text-muted-foreground font-medium">Match {match.matchNumber}</span>
                          </div>
                          <div className={`p-2 rounded mb-1 ${match.winnerId === match.team1Id ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/30'}`}>
                            {team1 ? (
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Team {team1.teamNumber}</div>
                                {team1Players.map((name, i) => (
                                  <div key={i} className="text-sm truncate">{name}</div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">TBD</span>
                            )}
                          </div>
                          <div className="text-sm text-center text-muted-foreground font-medium py-1">vs</div>
                          <div className={`p-2 rounded ${match.winnerId === match.team2Id ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/30'}`}>
                            {team2 ? (
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Team {team2.teamNumber}</div>
                                {team2Players.map((name, i) => (
                                  <div key={i} className="text-sm truncate">{name}</div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">TBD</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
