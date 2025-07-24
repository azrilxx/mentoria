
import TrackPageClient from './track-page-client';

interface TrackPageProps {
  params: {
    trackId: string;
  };
}

// This is a server component to handle params
export default function TrackPage({ params }: TrackPageProps) {
  const { trackId } = params;

  return <TrackPageClient trackId={trackId} />;
}
