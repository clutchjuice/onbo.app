'use client';

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Loader2, Plus, MoreHorizontal, Trash2 } from "lucide-react"
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Workflow {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  steps: any[]
  connections: any[]
}

interface WorkflowCardProps {
  workflow: Workflow
  onDelete: () => void
}

function WorkflowCard({ workflow, onDelete }: WorkflowCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking inside the menu or dialog, don't navigate
    const isMenuClick = !!(e.target as HTMLElement).closest('[data-menu]')
    const isDialogClick = !!(e.target as HTMLElement).closest('[role="dialog"]')
    
    if (isMenuClick || isDialogClick) {
      e.stopPropagation()
      return
    }
    router.push(`/workflows/${workflow.id}`)
  }

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
        onClick={handleClick}
      >
        <CardHeader className="relative">
          <div 
            className="absolute right-4 top-4" 
            data-menu 
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle>{workflow.name}</CardTitle>
          <CardDescription>{workflow.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>{workflow.steps.length} tasks • Last updated {new Date(workflow.updated_at).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent title="Delete Workflow">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workflow.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete()
                setShowDeleteDialog(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const loadWorkflows = async () => {
    try {
      // Get the user's current workspace
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Please sign in to view workflows')
        router.push('/login')
        return
      }

      // Get user's active workspace
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('active_workspace')
        .eq('id', user.id)
        .single()

      if (userDataError || !userData?.active_workspace) {
        toast.error('No active workspace found. Please create or select a workspace first.')
        router.push('/workspaces')
        return
      }

      // Check if user is a member of the workspace
      const { data: membership, error: membershipError } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', userData.active_workspace)
        .eq('user_id', user.id)
        .single()

      if (membershipError || !membership) {
        toast.error('You do not have access to this workspace')
        router.push('/dashboard')
        return
      }

      // Get workflows for the workspace
      const { data: workflowData, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('workspace_id', userData.active_workspace)
        .order('created_at', { ascending: false })

      if (workflowError) {
        console.error('Error loading workflows:', workflowError)
        toast.error('Failed to load workflows')
        return
      }

      setWorkflows(workflowData || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWorkflows()
  }, [])

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId)

      if (error) {
        throw error
      }

      toast.success('Workflow deleted successfully')
      // Refresh the workflows list
      loadWorkflows()
    } catch (error) {
      console.error('Error deleting workflow:', error)
      toast.error('Failed to delete workflow')
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar className="hidden lg:flex" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Workflows</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
              <p className="text-muted-foreground">
                Create and manage your onboarding workflows
              </p>
            </div>
            <Link href="/workflows/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Workflow
              </Button>
            </Link>
          </div>
          <div className="grid gap-6 pt-8 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : workflows.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No workflows found. Create your first workflow to get started.</p>
              </div>
            ) : (
              workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onDelete={() => handleDeleteWorkflow(workflow.id)}
                />
              ))
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 