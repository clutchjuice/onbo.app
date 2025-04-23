"use client"

import * as React from "react"
import { Building2, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

type Workspace = {
  id: string
  name: string
  plan?: string
}

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const [isLoading, setIsLoading] = React.useState(true)
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspace] = React.useState<Workspace | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const supabase = createClient()

  React.useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setError(null)

        // First get the user's workspace IDs from their profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('No user found')
          setError('No user found')
          return
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('workspaces, active_workspace')
          .eq('id', user.id)
          .single()

        console.log('User data:', userData)

        if (userError) {
          console.error('Error fetching user data:', userError)
          setError('Error fetching user data')
          return
        }

        // Handle case where user has no workspaces
        if (!userData?.workspaces?.length) {
          console.log('No workspaces found in user data')
          setWorkspaces([])
          setIsLoading(false)
          return
        }

        // Then fetch the actual workspace details
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .select('id, name')
          .in('id', userData.workspaces)

        console.log('Workspace data:', workspaceData)

        if (workspaceError) {
          console.error('Error fetching workspaces:', workspaceError)
          setError('Error fetching workspaces')
          return
        }

        if (workspaceData && workspaceData.length > 0) {
          setWorkspaces(workspaceData)
          // Set active workspace to either the user's active workspace or the first one
          const activeWorkspace = userData.active_workspace 
            ? workspaceData.find(w => w.id === userData.active_workspace)
            : workspaceData[0]
          
          setActiveWorkspace(activeWorkspace || workspaceData[0])
        } else {
          console.log('No workspace data returned from query')
          setError('No workspaces found')
        }
      } catch (error) {
        console.error('Error in fetchWorkspaces:', error)
        setError('Unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspaces()
  }, [])

  const handleWorkspaceChange = async (workspace: Workspace) => {
    setActiveWorkspace(workspace)
    
    // Update the user's active workspace in the database
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('users')
        .update({ active_workspace: workspace.id })
        .eq('id', user.id)
    }
  }

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {activeWorkspace ? (
                  <>
                    <span className="truncate font-medium">{activeWorkspace.name}</span>
                    {activeWorkspace.plan && (
                      <span className="truncate text-xs capitalize">{activeWorkspace.plan} Plan</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="truncate font-medium text-muted-foreground">No Workspace</span>
                    <span className="truncate text-xs text-muted-foreground">Create or join a workspace</span>
                  </>
                )}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Workspaces
            </DropdownMenuLabel>
            {error ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                {error}
              </div>
            ) : workspaces.length > 0 ? (
              workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceChange(workspace)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Building2 className="size-3.5 shrink-0" />
                  </div>
                  <span className="flex-1 truncate">{workspace.name}</span>
                  {workspace.id === activeWorkspace?.id && (
                    <span className="ml-2 text-xs text-muted-foreground">Active</span>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No workspaces found
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" asChild>
              <a href="/workspaces/new">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">New workspace</div>
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
