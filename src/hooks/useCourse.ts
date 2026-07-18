import { courseService } from '../services/courseService'
import { useLearningProgress } from './useLearningProgress'
export function useCourse(courseId?: string) { const { progress } = useLearningProgress(); return courseId ? courseService.getCourse(courseId, progress.completedLessonIds, progress.latestQuizResult) : undefined }
