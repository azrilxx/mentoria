import { 
  saveUserProgress, 
  getUserProgress, 
  updateUserProgress, 
  getUserProgressByTrackId,
  getOnboardingTrackById,
  UserProgress,
  OnboardingTrack 
} from './firebase';

export interface ProgressCreationData {
  trackId: string;
  duration: number;
  topic: string;
  scope: string;
  seniority: string;
}

export class ProgressTrackingService {
  /**
   * Creates a new progress entry when a plan is generated
   */
  static async createProgress(uid: string, data: ProgressCreationData): Promise<string> {
    const now = new Date().toISOString();
    
    const progressData: Omit<UserProgress, 'id'> = {
      trackId: data.trackId,
      status: 'draft',
      generatedAt: now,
      lastViewed: now,
      duration: data.duration,
      topic: data.topic,
      scope: data.scope,
      seniority: data.seniority,
    };

    return await saveUserProgress(uid, progressData);
  }

  /**
   * Updates the lastViewed timestamp when a user views a plan
   */
  static async updateLastViewed(uid: string, trackId: string): Promise<void> {
    const progress = await getUserProgressByTrackId(uid, trackId);
    if (progress && progress.id) {
      await updateUserProgress(uid, progress.id, {
        lastViewed: new Date().toISOString(),
      });
    }
  }

  /**
   * Confirms a plan - updates status and sets confirmedAt timestamp
   */
  static async confirmPlan(uid: string, trackId: string): Promise<void> {
    const progress = await getUserProgressByTrackId(uid, trackId);
    if (progress && progress.id) {
      await updateUserProgress(uid, progress.id, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Archives a plan
   */
  static async archivePlan(uid: string, trackId: string): Promise<void> {
    const progress = await getUserProgressByTrackId(uid, trackId);
    if (progress && progress.id) {
      await updateUserProgress(uid, progress.id, {
        status: 'archived',
      });
    }
  }

  /**
   * Gets all progress entries for a user
   */
  static async getUserProgressList(uid: string): Promise<UserProgress[]> {
    return await getUserProgress(uid);
  }

  /**
   * Gets progress for a specific track
   */
  static async getProgressByTrackId(uid: string, trackId: string): Promise<UserProgress | null> {
    return await getUserProgressByTrackId(uid, trackId);
  }

  /**
   * Gets the full training plan data along with progress info
   */
  static async getTrainingPlanWithProgress(uid: string, trackId: string): Promise<{
    track: OnboardingTrack | null;
    progress: UserProgress | null;
  }> {
    const [track, progress] = await Promise.all([
      getOnboardingTrackById(trackId),
      getUserProgressByTrackId(uid, trackId),
    ]);

    return { track, progress };
  }

  /**
   * Formats status for display
   */
  static getStatusLabel(status: UserProgress['status']): string {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'confirmed':
        return 'Confirmed';
      case 'archived':
        return 'Archived';
      default:
        return 'Unknown';
    }
  }

  /**
   * Gets status color for UI components
   */
  static getStatusColor(status: UserProgress['status']): string {
    switch (status) {
      case 'draft':
        return 'gray';
      case 'confirmed':
        return 'green';
      case 'archived':
        return 'red';
      default:
        return 'gray';
    }
  }
}
