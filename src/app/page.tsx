import { OnboardingPlanner } from "@/components/onboarding-planner";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";

export default function Home() {
  const companyName = "Desaria Group";
  const sector = "Real Estate";
  const companyId = "desaria-group-123"; // Placeholder

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background">
      <div className="w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
             <div className="text-left">
                <div className="inline-flex items-center gap-3">
                   <Icons.logo className="h-10 w-10 text-primary" />
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Welcome, HR team at {companyName}
                  </h1>
                </div>
                <p className="mt-2 text-lg text-muted-foreground italic">
                  Custom onboarding builder for {sector} compliance.
                </p>
             </div>
             <div>
                <Button asChild>
                  <Link href="/admin/sop">
                    <FilePlus className="mr-2 h-4 w-4" />
                    Manage SOPs
                  </Link>
                </Button>
             </div>
          </div>
        </header>
        <OnboardingPlanner companyId={companyId} />
      </div>
    </main>
  );
}
