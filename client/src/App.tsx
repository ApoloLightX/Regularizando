// Regularizando / Observatório Terra: preservar a linguagem editorial-cartográfica,
// a paleta petróleo + verde mineral e a navegação orientada à evidência.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Contact from "./pages/Contact";
import Team from "./pages/Team";
import InviteAccept from "./pages/InviteAccept";
import Evidences from "./pages/Evidences";
import PilotTelecom from "./pages/PilotTelecom";
import Product from "./pages/Product";
import UseCases from "./pages/UseCases";
import DocumentHead from "./components/DocumentHead";
import Security from "./pages/Security";
import MarketingFooter from "./components/MarketingFooter";

function Router() {
  const [location] = useLocation();
  const appendFooter = ["/casos-de-uso", "/piloto-telecom", "/seguranca", "/contato"].includes(location);
  return (
    <><Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/produto"} component={Product} />
      <Route path={"/casos-de-uso"} component={UseCases} />
      <Route path={"/piloto-telecom"} component={PilotTelecom} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/comecar"} component={Dashboard} />
      <Route path={"/evidencias"} component={Evidences} />
      <Route path={"/equipe"} component={Team} />
      <Route path={"/convites/:token"} component={InviteAccept} />
      <Route path={"/contato"} component={Contact} />
      <Route path={"/seguranca"} component={Security} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>{appendFooter ? <MarketingFooter /> : null}</>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <DocumentHead />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
