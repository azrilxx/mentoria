
'use client';

import { AuthGuard } from "@/components/auth/AuthGuard";
import { TrackView } from "@/components/track-view";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface TrackPageProps {
    params: {
        trackId: string;
    };
}

export default function TrackPage({ params }: TrackPageProps) {
    const { trackId } = params;

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
                    </header>
                    <TrackView trackId={trackId} />
                </div>
            </main>
        </AuthGuard>
    );
}
