import { RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from './app/ErrorBoundary'
import { router } from './app/router'
import { RoleProvider } from './hooks/useRole'
import { LearningProgressProvider } from './context/LearningProgressContext'
import { ContentProvider } from './context/ContentContext'

function App() { return <ErrorBoundary><RoleProvider><ContentProvider><LearningProgressProvider><RouterProvider router={router} /></LearningProgressProvider></ContentProvider></RoleProvider></ErrorBoundary> }
export default App
