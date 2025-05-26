"use client"

import * as React from "react"
import {
  BarChart3,
  Users,
  Workflow,
  ListTodo,
  PlusCircle,
  UserCircle,
  LineChart,
  LayoutDashboard,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Workflows",
      url: "/workflows",
      icon: Workflow,
      isActive: true,
      items: [
        {
          title: "All Workflows",
          url: "/workflows",
          icon: ListTodo,
        },
      ],
    },
    {
      title: "Onboardees",
      url: "/onboardees",
      icon: Users,
      items: [
      ],
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
      items: [
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
