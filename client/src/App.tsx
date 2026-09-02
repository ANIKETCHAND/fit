/* Carbon Command Deck: Settings and Support are full command-center routes with the shared FitTrack shell. */
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { EchoAssistant } from "./components/ai/EchoAssistant";
import { RexiOnboardingModal } from "./components/onboarding/RexiOnboardingModal";
import { RexiGuidedTour } from "./components/onboarding/RexiGuidedTour";
import { autoSyncAthleteLocation } from "./lib/location-resolver";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
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
import BodyMap from "./pages/BodyMap";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Landing} />
      <Route path={"/landing"} component={Landing} />
      <Route path={"/overview"} component={Home} />
      <Route path={"/home"} component={Home} />
      <Route path={"/body-map"} component={BodyMap} />
      <Route path={"/anatomy"} component={BodyMap} />
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
  useEffect(() => {
    // Proactively request and auto-sync athlete location on app initialization
    autoSyncAthleteLocation().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <AnimatedBackground />
          <Toaster />
          <Router />
          <EchoAssistant />
          <RexiOnboardingModal />
          <RexiGuidedTour />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
