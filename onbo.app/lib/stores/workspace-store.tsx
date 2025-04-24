"use client"

import * as React from "react"
import { debounce } from "lodash"
import { createClient } from "@/utils/supabase/client"

type Workspace = {
  id: string
  name: string
  plan?: string
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  isLoading: boolean
  error: string | null
  setActiveWorkspace: (workspace: Workspace) => void
}

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(undefined)

// Cache key for workspaces
const CACHE_KEY = 'onbo_workspaces'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspace] = React.useState<Workspace | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const supabase = createClient()

  // Load workspaces from cache or fetch from database
  React.useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setError(null)

        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_DURATION) {
            const { workspaces, activeWorkspace } = data
            setWorkspaces(workspaces)
            setActiveWorkspace(activeWorkspace)
            setIsLoading(false)
            return
          }
        }

        // If no cache or expired, fetch from database
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('No user found')
          return
        }

        // Fetch user data and workspaces in parallel
        const [userResponse, workspacesResponse] = await Promise.all([
          supabase
            .from('users')
            .select('workspaces, active_workspace')
            .eq('id', user.id)
            .single(),
          supabase
            .from('workspaces')
            .select('id, name')
        ])

        if (userResponse.error) {
          console.error('Error fetching user data:', userResponse.error)
          setError('Error fetching user data')
          return
        }

        if (workspacesResponse.error) {
          console.error('Error fetching workspaces:', workspacesResponse.error)
          setError('Error fetching workspaces')
          return
        }

        const userData = userResponse.data
        const allWorkspaces = workspacesResponse.data

        // Filter workspaces to only those the user has access to
        const userWorkspaces = allWorkspaces.filter(w => 
          userData.workspaces?.includes(w.id)
        )

        if (userWorkspaces.length > 0) {
          // Set active workspace
          const activeWorkspace = userData.active_workspace 
            ? userWorkspaces.find(w => w.id === userData.active_workspace)
            : userWorkspaces[0]

          setWorkspaces(userWorkspaces)
          setActiveWorkspace(activeWorkspace || userWorkspaces[0])

          // Cache the results
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: {
              workspaces: userWorkspaces,
              activeWorkspace: activeWorkspace || userWorkspaces[0]
            },
            timestamp: Date.now()
          }))
        } else {
          setError('No workspaces found')
        }
      } catch (error) {
        console.error('Error loading workspaces:', error)
        setError('Unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkspaces()
  }, [])

  // Debounced workspace change handler
  const debouncedWorkspaceChange = React.useCallback(
    React.useMemo(
      () =>
        debounce(async (workspace: Workspace) => {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase
              .from('users')
              .update({ active_workspace: workspace.id })
              .eq('id', user.id)
          }
        }, 1000),
      [supabase]
    ),
    []
  )

  const handleWorkspaceChange = (workspace: Workspace) => {
    setActiveWorkspace(workspace)
    
    // Update cache immediately
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: { ...data, activeWorkspace: workspace },
        timestamp
      }))
    }

    // Debounce the database update
    debouncedWorkspaceChange(workspace)
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isLoading,
        error,
        setActiveWorkspace: handleWorkspaceChange,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
} 