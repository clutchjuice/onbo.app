"use client"

import * as React from "react"
import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { UploadCloud, File as FileIcon, Trash2, Loader, CheckCircle, AlertCircle, X } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

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

interface FileWithPreview {
  id: string
  preview: string
  progress: number
  name: string
  size: number
  type: string
  lastModified?: number
  file?: File
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      onChange,
      value,
      error,
      allowedTypes,
      maxFileSize,
      allowMultiple,
      className,
      name,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const [files, setFiles] = useState<FileWithPreview[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Sync with value prop (for controlled usage)
    useEffect(() => {
      if (value) {
        setFiles(Array.from(value).map((file) => ({
          id: `${URL.createObjectURL(file)}-${file.lastModified}`,
          preview: URL.createObjectURL(file),
          progress: 100,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          file,
        })))
      } else {
        setFiles([])
      }
    }, [value])

    // Process dropped or selected files
    const handleFiles = (fileList: FileList) => {
      let filteredFiles = Array.from(fileList)
      if (allowedTypes) {
        const allowed = allowedTypes.split(",").map((t) => t.trim().toLowerCase())
        filteredFiles = filteredFiles.filter((file) =>
          allowed.some((type) => file.name.toLowerCase().endsWith(type) || file.type.toLowerCase().includes(type.replace('.', '')))
        )
      }
      if (maxFileSize) {
        filteredFiles = filteredFiles.filter((file) => file.size <= maxFileSize * 1024 * 1024)
      }
      if (!allowMultiple) {
        filteredFiles = filteredFiles.slice(0, 1)
      }
      const newFiles = filteredFiles.map((file) => ({
        id: `${URL.createObjectURL(file)}-${Date.now()}`,
        preview: URL.createObjectURL(file),
        progress: 0,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        file,
      }))
      setFiles((prev) => allowMultiple ? [...prev, ...newFiles] : newFiles)
      newFiles.forEach((f) => simulateUpload(f.id))
      // Call onChange with a FileList
      if (onChange) {
        const dataTransfer = new DataTransfer()
        (allowMultiple ? [...(value ? Array.from(value) : []), ...filteredFiles] : filteredFiles).forEach((file: File) => {
          dataTransfer.items.add(file)
        })
        onChange(dataTransfer.files.length ? dataTransfer.files : null)
      }
    }

    // Simulate upload progress
    const simulateUpload = (id: string) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, progress: Math.min(progress, 100) } : f
          )
        )
        if (progress >= 100) {
          clearInterval(interval)
          if (navigator.vibrate) navigator.vibrate(100)
        }
      }, 300)
    }

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
    }

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const onDragLeave = () => setIsDragging(false)

    const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleFiles(e.target.files)
    }

    const formatFileSize = (bytes: number): string => {
      if (!bytes) return "0 Bytes"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
    }

    const removeFile = (id: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== id))
      if (onChange && value) {
        const filesArr = Array.from(value).filter((file: File) => `${URL.createObjectURL(file)}-${file.lastModified}` !== id)
        const dataTransfer = new DataTransfer()
        filesArr.forEach((file: File) => dataTransfer.items.add(file))
        onChange(dataTransfer.files.length ? dataTransfer.files : null)
      }
    }

    const clearAll = () => {
      setFiles([])
      if (onChange) onChange(null)
    }

    return (
      <div className={cn("w-full max-w-3xl mx-auto p-4 md:p-6", className)}>
        {/* Drop zone */}
        <motion.div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          initial={false}
          animate={{
            borderColor: isDragging ? "#3b82f6" : "#ffffff10",
            scale: isDragging ? 1.02 : 1,
          }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className={clsx(
            "relative rounded-2xl p-8 md:p-12 text-center cursor-pointer bg-secondary/50 border border-primary/10 shadow-sm hover:shadow-md backdrop-blur group",
            isDragging && "ring-4 ring-blue-400/30 border-blue-500"
          )}
        >
          <div className="flex flex-col items-center gap-5">
            <motion.div
              animate={{ y: isDragging ? [-5, 0, -5] : 0 }}
              transition={{
                duration: 1.5,
                repeat: isDragging ? Infinity : 0,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <motion.div
                animate={{
                  opacity: isDragging ? [0.5, 1, 0.5] : 1,
                  scale: isDragging ? [0.95, 1.05, 0.95] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: isDragging ? Infinity : 0,
                  ease: "easeInOut",
                }}
                className="absolute -inset-4 bg-blue-400/10 rounded-full blur-md"
                style={{ display: isDragging ? "block" : "none" }}
              />
              <UploadCloud
                className={clsx(
                  "w-16 h-16 md:w-20 md:h-20 drop-shadow-sm",
                  isDragging
                    ? "text-blue-500"
                    : "text-zinc-700 dark:text-zinc-300 group-hover:text-blue-500 transition-colors duration-300"
                )}
              />
            </motion.div>

            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
                {isDragging
                  ? "Drop files here"
                  : files.length
                  ? "Add more files"
                  : "Upload your files"}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300 md:text-lg max-w-md mx-auto">
                {isDragging ? (
                  <span className="font-medium text-blue-500">Release to upload</span>
                ) : (
                  <>
                    Drag & drop files here, or {" "}
                    <span className="text-blue-500 font-medium">browse</span>
                  </>
                )}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Supports images, documents, videos, and more
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              multiple={allowMultiple}
              hidden
              onChange={onSelect}
              accept={allowedTypes}
              name={name}
              required={required}
              disabled={disabled}
              {...props}
            />
          </div>
        </motion.div>

        {/* Uploaded files list */}
        <div className="mt-8">
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center mb-3 px-2"
              >
                <h3 className="font-semibold text-lg md:text-xl text-zinc-800 dark:text-zinc-200">
                  Uploaded files ({files.length})
                </h3>
                {files.length > 1 && (
                  <button
                    onClick={clearAll}
                    className="text-sm font-medium px-3 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-md text-zinc-700 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 transition-colors duration-200"
                  >
                    Clear all
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={clsx(
              "flex flex-col gap-3 overflow-y-auto pr-2",
              files.length > 3 &&
                "max-h-96 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent"
            )}
          >
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="px-4 py-4 flex items-start gap-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 shadow hover:shadow-md transition-all duration-200"
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    {file.type.startsWith("image/") ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border dark:border-zinc-700 shadow-sm"
                      />
                    ) : file.type.startsWith("video/") ? (
                      <video
                        src={file.preview}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border dark:border-zinc-700 shadow-sm"
                        controls={false}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster=""
                      />
                    ) : (
                      <FileIcon className="w-16 h-16 md:w-20 md:h-20 text-zinc-400" />
                    )}
                    {file.progress === 100 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -right-2 -bottom-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm"
                      >
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </motion.div>
                    )}
                  </div>

                  {/* File info & progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1 w-full">
                      {/* Filename */}
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon className="w-5 h-5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                        <h4
                          className="font-medium text-base md:text-lg truncate text-zinc-800 dark:text-zinc-200"
                          title={file.name}
                        >
                          {file.name}
                        </h4>
                      </div>

                      {/* Details & remove/loading */}
                      <div className="flex items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="text-xs md:text-sm">
                          {formatFileSize(file.size)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-medium">
                            {Math.round(file.progress)}%
                          </span>
                          {file.progress < 100 ? (
                            <Loader className="w-4 h-4 animate-spin text-blue-500" />
                          ) : (
                            <Trash2
                              className="w-4 h-4 cursor-pointer text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors duration-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFile(file.id)
                              }}
                              aria-label="Remove file"
                            />
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${file.progress}%` }}
                        transition={{
                          duration: 0.4,
                          type: "spring",
                          stiffness: 100,
                          ease: "easeOut",
                        }}
                        className={clsx(
                          "h-full rounded-full shadow-inner",
                          file.progress < 100 ? "bg-blue-500" : "bg-emerald-500"
                        )}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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