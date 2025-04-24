'use client';

import { Card } from "@/components/ui/card";
import { ArrowRight, Wand2, FileCode, Layout, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewWorkflow() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/workflows" 
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to workflows</span>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Create a new workflow</h1>
        <p className="text-muted-foreground mb-8">How would you like to get started?</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create from scratch */}
          <Link href="/workflows/editor/new">
            <Card className="p-6 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer h-full">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <Layout className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Create from scratch</h2>
                <p className="text-muted-foreground text-sm flex-grow">
                  Start with a blank canvas and build your workflow step by step
                </p>
                <div className="flex items-center mt-4 text-primary">
                  <span className="text-sm">Get started</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Create with AI */}
          <Link href="/workflows/ai/new">
            <Card className="p-6 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer h-full bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <Wand2 className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Create with AI</h2>
                <p className="text-muted-foreground text-sm flex-grow">
                  Describe your workflow and let AI generate it for you
                </p>
                <div className="flex items-center mt-4 text-primary">
                  <span className="text-sm">Try it out</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Create from template */}
          <Link href="/workflows/templates">
            <Card className="p-6 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer h-full">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <FileCode className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Use a template</h2>
                <p className="text-muted-foreground text-sm flex-grow">
                  Choose from our library of pre-built workflow templates
                </p>
                <div className="flex items-center mt-4 text-primary">
                  <span className="text-sm">Browse templates</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
} 