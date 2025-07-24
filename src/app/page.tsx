import { OnboardingPlanner } from "@/components/onboarding-planner";
import { Icons } from "@/components/icons";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background">
      <div className="w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3">
             <Icons.logo className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Mentoria Onboard
            </h1>
          </div>

          <p className="mt-2 text-lg text-muted-foreground">
            AI-assisted onboarding planner for Malaysian companies.
          </p>
        </header>
        <OnboardingPlanner />
      </div>
    </main>
  );
}
