import { courseService } from './courseService'
import { gradeQuiz } from '../utils/quiz'
export const quizService = { getQuestions: (courseId: string) => courseService.getQuestions(courseId), grade: gradeQuiz }
