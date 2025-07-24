import { OnboardingPlanner } from "@/components/onboarding-planner";
import { Icons } from "@/components/icons";

export default function Home() {
  const companyName = "Desaria Group";
  const sector = "Real Estate";

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background">
      <div className="w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3">
             <Icons.logo className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome, HR team at {companyName}
            </h1>
          </div>

          <p className="mt-2 text-lg text-muted-foreground italic">
            Custom onboarding builder for {sector} compliance.
          </p>
        </header>
        <OnboardingPlanner />
      </div>
    </main>
  );
}
