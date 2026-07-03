interface DemoGuideBannerProps {
  persona: 'croupier' | 'participant';
}

export function DemoGuideBanner({ persona }: DemoGuideBannerProps) {
  return (
    <div className="rounded-md border border-bm-accentSoftBorder bg-bm-accentSoft px-3 py-2.5 text-sm text-bm-accentSoftText">
      <p className="font-medium">Demo mode — mock data, no Businessmap connection</p>
      <p className="text-xs opacity-90 mt-1 leading-relaxed">
        {persona === 'croupier' ? (
          <>
            You are <strong>Ana</strong> (Croupier). Pick a task in the queue, then{' '}
            <strong>Start Voting</strong> and <strong>Reveal Votes</strong>. Switch to Participant
            to try the deck.
          </>
        ) : (
          <>
            You are <strong>Bruno</strong> (participant). You cannot change the active task — only
            vote on the card the Croupier selected. Switch to Croupier to run the session.
          </>
        )}
      </p>
    </div>
  );
}
