"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const STORAGE_KEY = "sidebar_dropdown_states"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: LucideIcon
    }[]
  }[]
}) {
  // Initialize state from localStorage or default values
  const [openStates, setOpenStates] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  // Save state changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(openStates))
  }, [openStates])

  const handleToggle = (title: string, isOpen: boolean) => {
    setOpenStates(prev => ({
      ...prev,
      [title]: isOpen
    }))
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <a 
          href="/dashboard" 
          className="inline-flex items-center justify-center rounded-md bg-transparent px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          View Dashboard
        </a>
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.flatMap((item) => [
          // Main link
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
              <a href={item.url}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>,
          // Sub-links
          ...(item.items
            ? item.items.map((subItem) => (
                <SidebarMenuItem key={item.title + '-' + subItem.title}>
                  <SidebarMenuButton asChild tooltip={subItem.title}>
                    <a href={subItem.url}>
                      {subItem.icon && <subItem.icon />}
                      <span>{subItem.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            : []),
        ])}
      </SidebarMenu>
    </SidebarGroup>
  )
}
