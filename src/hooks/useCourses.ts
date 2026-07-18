import { useEffect, useState } from 'react'
import { getCourses } from '../services/courseService'
import type { Course } from '../types'

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason : new Error('Unknown course loading error')))
      .finally(() => setIsLoading(false))
  }, [])
  return { courses, isLoading, error }
}
