import { Card } from "@/components/ui/card";

export default function Bracket() {
  return (
    <div className="container mx-auto px-4 py-12">
       <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold text-white mb-2">สายการแข่งขัน</h1>
        <p className="text-muted-foreground">ติดตามเส้นทางสู่แชมป์</p>
      </div>

      <div className="overflow-x-auto pb-8">
        <div className="min-w-[800px] flex justify-center py-8">
           {/* Simple custom bracket visualization */}
           <div className="flex gap-12">
              {/* Round 1 */}
              <div className="flex flex-col justify-around gap-8">
                <BracketMatch teamA="IT Tiger" teamB="Civil Eng" scoreA={2} scoreB={0} />
                <BracketMatch teamA="Auto Mech" teamB="Accounting" scoreA={2} scoreB={1} />
                <BracketMatch teamA="Elec Power" teamB="Marketing" scoreA={0} scoreB={2} />
                <BracketMatch teamA="Business Com" teamB="Foods" scoreA={2} scoreB={0} />
              </div>

              {/* Round 2 */}
              <div className="flex flex-col justify-around gap-16">
                 <BracketMatch teamA="IT Tiger" teamB="Auto Mech" scoreA={2} scoreB={1} />
                 <BracketMatch teamA="Marketing" teamB="Business Com" scoreA={1} scoreB={2} />
              </div>

              {/* Finals */}
              <div className="flex flex-col justify-center">
                 <div className="relative">
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-accent font-bold tracking-widest uppercase">Champion</div>
                   <BracketMatch teamA="IT Tiger" teamB="Business Com" scoreA={3} scoreB={1} isFinal />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function BracketMatch({ teamA, teamB, scoreA, scoreB, isFinal }: any) {
  const winnerA = scoreA > scoreB;
  return (
    <Card className={`w-64 bg-card/50 border-white/10 ${isFinal ? 'border-accent shadow-[0_0_20px_rgba(14,165,233,0.3)]' : ''}`}>
      <div className={`flex justify-between p-3 border-b border-white/5 ${winnerA ? 'bg-primary/20' : ''}`}>
        <span className={`font-bold ${winnerA ? 'text-white' : 'text-muted-foreground'}`}>{teamA}</span>
        <span className="font-mono">{scoreA}</span>
      </div>
      <div className={`flex justify-between p-3 ${!winnerA ? 'bg-primary/20' : ''}`}>
        <span className={`font-bold ${!winnerA ? 'text-white' : 'text-muted-foreground'}`}>{teamB}</span>
        <span className="font-mono">{scoreB}</span>
      </div>
    </Card>
  );
}
