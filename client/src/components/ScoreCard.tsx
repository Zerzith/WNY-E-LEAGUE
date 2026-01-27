import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface ScoreCardProps {
  match: {
    id: number;
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
    game: string;
    status: string;
    winner?: string;
    bannerUrl?: string;
  };
}

export function ScoreCard({ match }: ScoreCardProps) {
  const isLive = match.status === 'live';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-card hover:border-accent/50 transition-colors group"
    >
      {/* Game Banner Background */}
      {match.bannerUrl && (
        <div className="absolute inset-0 z-0">
          <img 
            src={match.bannerUrl} 
            alt={match.game} 
            className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
        </div>
      )}
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 group-hover:to-primary/10 transition-colors" />
      
      {/* Status Badge */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <span className={`
          px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
          ${isLive 
            ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse' 
            : 'bg-secondary text-muted-foreground border border-white/5'}
        `}>
          {isLive ? 'Live Match' : match.status}
        </span>
      </div>

      <div className="relative z-10 p-6 pt-10">
        <div className="flex items-center justify-between gap-8">
          {/* Team A */}
          <div className="flex-1 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center border-2 border-transparent group-hover:border-primary/50 transition-all backdrop-blur-sm">
              <span className="text-2xl font-display font-bold text-white/80">{match.teamA.charAt(0)}</span>
            </div>
            <h3 className={`font-display font-bold text-lg ${match.winner === match.teamA ? 'text-accent' : 'text-white'}`}>
              {match.teamA}
            </h3>
            {match.winner === match.teamA && <Trophy className="w-4 h-4 text-accent" />}
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-4 font-display font-bold text-4xl bg-black/40 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md">
              <span className={match.scoreA > match.scoreB ? 'text-white' : 'text-white/50'}>{match.scoreA}</span>
              <span className="text-white/20 text-2xl">:</span>
              <span className={match.scoreB > match.scoreA ? 'text-white' : 'text-white/50'}>{match.scoreB}</span>
            </div>
            <span className="text-xs text-white/80 font-bold uppercase tracking-wider drop-shadow-md">
              {match.game}
            </span>
          </div>

          {/* Team B */}
          <div className="flex-1 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center border-2 border-transparent group-hover:border-destructive/50 transition-all backdrop-blur-sm">
              <span className="text-2xl font-display font-bold text-white/80">{match.teamB.charAt(0)}</span>
            </div>
            <h3 className={`font-display font-bold text-lg ${match.winner === match.teamB ? 'text-accent' : 'text-white'}`}>
              {match.teamB}
            </h3>
            {match.winner === match.teamB && <Trophy className="w-4 h-4 text-accent" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
