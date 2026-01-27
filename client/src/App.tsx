import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import RegisterTeam from "@/pages/RegisterTeam";
import Scoreboard from "@/pages/Scoreboard";
import Bracket from "@/pages/Bracket";
import HallOfFame from "@/pages/HallOfFame";
import Chat from "@/pages/Chat";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register-team" component={RegisterTeam} />
      <Route path="/scoreboard" component={Scoreboard} />
      <Route path="/bracket" component={Bracket} />
      <Route path="/hall-of-fame" component={HallOfFame} />
      <Route path="/chat" component={Chat} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
            <Navigation />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
