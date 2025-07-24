
'use client';

import { AuthGuard } from "@/components/auth/AuthGuard";
import { SettingsDashboard } from "@/components/settings/settings-dashboard";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    return (
        <AuthGuard requireAuth={true}>
            <main className="min-h-screen w-full flex-col items-center bg-background font-pt-sans">
                <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                    <header className="mb-8">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard">
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground mt-2 font-montserrat">
                            Settings
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Manage your profile, subscription, and notification preferences.
                        </p>
                    </header>
                    <SettingsDashboard />
                </div>
            </main>
        </AuthGuard>
    );
}
