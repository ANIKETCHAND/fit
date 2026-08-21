/* Carbon Command Deck: Settings and Support are full command-center routes with the shared FitTrack shell. */
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AnimatedBackground } from "./components/AnimatedBackground";
import Home from "./pages/Home";
import Glowinn from "./pages/Glowinn";
import LogFood from "./pages/LogFood";
import LogWorkout from "./pages/LogWorkout";
import LogWeight from "./pages/LogWeight";
import StartSession from "./pages/StartSession";
import Achievements from "./pages/Achievements";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import GpsTracker from "./pages/GpsTracker";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/glowinn"} component={Glowinn} />
      <Route path={"/log-food"} component={LogFood} />
      <Route path={"/log-workout"} component={LogWorkout} />
      <Route path={"/log-weight"} component={LogWeight} />
      <Route path={"/start-session"} component={StartSession} />
      <Route path={"/achievements"} component={Achievements} />
      <Route path={"/exercise-library"} component={ExerciseLibrary} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/support"} component={Support} />
      <Route path={"/gps"} component={GpsTracker} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AnimatedBackground />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
