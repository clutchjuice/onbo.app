"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Upload, X, FileIcon, AlertCircle } from "lucide-react"
import { Button } from "./button"

interface FileUploadProps {
  onChange?: (files: FileList | null) => void
  value?: FileList | null
  error?: string
  allowedTypes?: string
  maxFileSize?: number
  allowMultiple?: boolean
  className?: string
  name?: string
  required?: boolean
  disabled?: boolean
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  ({ className, onChange, value, error, allowedTypes, maxFileSize, allowMultiple, ...props }, ref) => {
    const [dragActive, setDragActive] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true)
      } else if (e.type === "dragleave") {
        setDragActive(false)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        if (onChange) {
          onChange(e.dataTransfer.files)
        }
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.files)
      }
    }

    const handleClick = () => {
      inputRef.current?.click()
    }

    const removeFile = (indexToRemove: number) => {
      if (!value || !onChange) return;
      
      // Convert FileList to array and remove the file at the specified index
      const files = Array.from(value);
      files.splice(indexToRemove, 1);
      
      if (files.length === 0) {
        // If no files left, reset the input
        onChange(null);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      } else {
        // Create a new FileList from the remaining files
        const dataTransfer = new DataTransfer();
        files.forEach(file => {
          dataTransfer.items.add(file);
        });
        onChange(dataTransfer.files);
      }
    }

    const formatFileSize = (size: number) => {
      if (size < 1024) return size + ' B'
      else if (size < 1048576) return (size / 1024).toFixed(1) + ' KB'
      else return (size / 1048576).toFixed(1) + ' MB'
    }

    return (
      <div className="w-full">
        <div
          className={cn(
            "relative flex flex-col items-center justify-center w-full min-h-[150px] rounded-lg border-2 border-dashed transition-colors duration-150 ease-in-out cursor-pointer",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-accent hover:border-muted-foreground/50",
            error && "border-destructive/50 hover:border-destructive",
            className
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            multiple={allowMultiple}
            accept={allowedTypes}
            {...props}
          />

          {value && value.length > 0 ? (
            <div className="w-full p-4 space-y-3">
              {Array.from(value).map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-md bg-accent/50"
                >
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drag & drop files here or click to browse
              </p>
              {allowedTypes && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Allowed types: {allowedTypes}
                </p>
              )}
              {maxFileSize && (
                <p className="text-xs text-muted-foreground">
                  Max size: {maxFileSize}MB
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-x-2 mt-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }
)
FileUpload.displayName = "FileUpload"

export { FileUpload } 