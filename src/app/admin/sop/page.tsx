import { SopManager } from "@/components/sop-manager";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SopAdminPage() {
    const companyId = "desaria-group-123"; // Placeholder
    const userId = "hr_admin_user"; // Placeholder

    return (
        <main className="flex min-h-screen w-full flex-col items-center bg-background">
            <div className="w-full max-w-6xl p-4 sm:p-6 lg:p-8">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <Button variant="outline" size="sm" asChild>
                           <Link href="/">
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back to Planner
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground mt-2">
                           SOP Management
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Upload and manage company-specific documents.
                        </p>
                    </div>
                </header>
                <SopManager companyId={companyId} userId={userId} />
            </div>
        </main>
    );
}
