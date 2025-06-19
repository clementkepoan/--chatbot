"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrashIcon, PlusIcon, CheckIcon, XIcon, EditIcon } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"

interface EditableCell {
  id: string
  field: string
  value: string
  isEditing: boolean
}

interface EditableTableProps {
  title: string
  data: any[]
  columns: {
    key: string
    label: string
    type: "text" | "textarea"
    placeholder?: string
  }[]
  onAdd: (item: any) => Promise<void>
  onUpdate: (id: string, field: string, value: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  emptyMessage: string
}

export function EditableTable({ title, data, columns, onAdd, onUpdate, onDelete, emptyMessage }: EditableTableProps) {
  const [editingCells, setEditingCells] = useState<Set<string>>(new Set())
  const [cellValues, setCellValues] = useState<Record<string, string>>({})
  const [newRow, setNewRow] = useState<Record<string, string>>({})
  const [isAddingRow, setIsAddingRow] = useState(false)
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set())
  const { isEnglish } = useLanguage()
  const { toast } = useToast()
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement>>({})

  // Initialize cell values when data changes
  useEffect(() => {
    const initialValues: Record<string, string> = {}
    data.forEach((item) => {
      columns.forEach((column) => {
        const cellKey = `${item.id}-${column.key}`
        initialValues[cellKey] = item[column.key] || ""
      })
    })
    setCellValues(initialValues)
  }, [data, columns])

  const getCellKey = (id: string, field: string) => `${id}-${field}`

  const startEditing = (id: string, field: string) => {
    const cellKey = getCellKey(id, field)
    setEditingCells((prev) => new Set([...prev, cellKey]))

    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      const input = inputRefs.current[cellKey]
      if (input) {
        input.focus()
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.select()
        }
      }
    }, 50)
  }

  const stopEditing = (id: string, field: string) => {
    const cellKey = getCellKey(id, field)
    setEditingCells((prev) => {
      const newSet = new Set(prev)
      newSet.delete(cellKey)
      return newSet
    })
  }

  const handleCellChange = (id: string, field: string, value: string) => {
    const cellKey = getCellKey(id, field)
    setCellValues((prev) => ({
      ...prev,
      [cellKey]: value,
    }))
  }

  const saveCellValue = async (id: string, field: string) => {
    const cellKey = getCellKey(id, field)
    const value = cellValues[cellKey] || ""

    if (!value.trim()) {
      toast({
        title: isEnglish ? "Error" : "錯誤",
        description: isEnglish ? "Field cannot be empty" : "欄位不能為空",
        variant: "destructive",
      })
      return
    }

    setLoadingCells((prev) => new Set([...prev, cellKey]))

    try {
      await onUpdate(id, field, value.trim())
      stopEditing(id, field)
      toast({
        title: isEnglish ? "Success" : "成功",
        description: isEnglish ? "Updated successfully" : "更新成功",
      })
    } catch (error) {
      console.error("Error updating cell:", error)
      toast({
        title: isEnglish ? "Error" : "錯誤",
        description: isEnglish ? "Failed to update" : "更新失敗",
        variant: "destructive",
      })
    } finally {
      setLoadingCells((prev) => {
        const newSet = new Set(prev)
        newSet.delete(cellKey)
        return newSet
      })
    }
  }

  const cancelEdit = (id: string, field: string) => {
    const cellKey = getCellKey(id, field)
    // Reset to original value
    const originalItem = data.find((item) => item.id === id)
    if (originalItem) {
      setCellValues((prev) => ({
        ...prev,
        [cellKey]: originalItem[field] || "",
      }))
    }
    stopEditing(id, field)
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string, field: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      saveCellValue(id, field)
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEdit(id, field)
    }
  }

  const handleNewRowChange = (field: string, value: string) => {
    setNewRow((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addNewRow = async () => {
    // Check if all required fields are filled
    const missingFields = columns.filter((col) => !newRow[col.key]?.trim())
    if (missingFields.length > 0) {
      toast({
        title: isEnglish ? "Error" : "錯誤",
        description: isEnglish ? "Please fill all fields" : "請填寫所有欄位",
        variant: "destructive",
      })
      return
    }

    try {
      await onAdd(newRow)
      setNewRow({})
      setIsAddingRow(false)
      toast({
        title: isEnglish ? "Success" : "成功",
        description: isEnglish ? "Added successfully" : "新增成功",
      })
    } catch (error) {
      console.error("Error adding row:", error)
      toast({
        title: isEnglish ? "Error" : "錯誤",
        description: isEnglish ? "Failed to add" : "新增失敗",
        variant: "destructive",
      })
    }
  }

  const cancelNewRow = () => {
    setNewRow({})
    setIsAddingRow(false)
  }

  const renderCell = (item: any, column: any) => {
    const cellKey = getCellKey(item.id, column.key)
    const isEditing = editingCells.has(cellKey)
    const isLoading = loadingCells.has(cellKey)
    const value = cellValues[cellKey] || ""

    if (isEditing) {
      const commonProps = {
        ref: (el: HTMLInputElement | HTMLTextAreaElement | null) => {
          if (el) inputRefs.current[cellKey] = el
        },
        value,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          handleCellChange(item.id, column.key, e.target.value),
        onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, item.id, column.key),
        className: "w-full border-brand-red/30 focus:border-brand-red text-sm",
        disabled: isLoading,
      }

      return (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            {column.type === "textarea" ? <Textarea {...commonProps} rows={2} /> : <Input {...commonProps} />}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveCellValue(item.id, column.key)}
              disabled={isLoading}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <CheckIcon className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cancelEdit(item.id, column.key)}
              disabled={isLoading}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div
        className="group flex items-center justify-between cursor-pointer hover:bg-brand-beige/50 p-1 rounded min-h-[2rem]"
        onClick={() => startEditing(item.id, column.key)}
      >
        <span className="flex-1 text-sm">{value}</span>
        <EditIcon className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
    )
  }

  return (
    <Card className="border-brand-red/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-brand-black">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-black/60">
              {data.length} {isEnglish ? "items" : "項目"}
            </span>
            <Button
              onClick={() => setIsAddingRow(true)}
              size="sm"
              className="bg-brand-red hover:bg-brand-red/90 text-white"
              disabled={isAddingRow}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              {isEnglish ? "Add" : "新增"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-red/20 bg-brand-cream/50">
                {columns.map((column) => (
                  <TableHead key={column.key} className="text-brand-black font-semibold">
                    {column.label}
                  </TableHead>
                ))}
                <TableHead className="text-brand-black font-semibold w-20">{isEnglish ? "Actions" : "操作"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Add new row */}
              {isAddingRow && (
                <TableRow className="border-brand-red/10 bg-green-50/50">
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.type === "textarea" ? (
                        <Textarea
                          placeholder={column.placeholder}
                          value={newRow[column.key] || ""}
                          onChange={(e) => handleNewRowChange(column.key, e.target.value)}
                          className="border-brand-red/30 focus:border-brand-red text-sm"
                          rows={2}
                        />
                      ) : (
                        <Input
                          placeholder={column.placeholder}
                          value={newRow[column.key] || ""}
                          onChange={(e) => handleNewRowChange(column.key, e.target.value)}
                          className="border-brand-red/30 focus:border-brand-red text-sm"
                        />
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={addNewRow}
                        className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelNewRow}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Existing rows */}
              {data.map((item) => (
                <TableRow key={item.id} className="border-brand-red/10 hover:bg-brand-beige/30">
                  {columns.map((column) => (
                    <TableCell key={column.key} className="p-2">
                      {renderCell(item, column)}
                    </TableCell>
                  ))}
                  <TableCell className="p-2">
                    <Button
                      onClick={() => onDelete(item.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {/* Empty state */}
              {data.length === 0 && !isAddingRow && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center py-8 text-brand-black/60">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
