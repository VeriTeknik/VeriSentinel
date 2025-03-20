"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Filter, Search, AlertTriangle, Info, AlertCircle, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AuditLog, SeverityLevel, ComplianceStandard } from "@shared/types/audit-logs"
import { getSeverityColor, getSeverityLabel, formatDate } from "@/lib/utils"

interface AuditLogsViewProps {
  logs: AuditLog[]
}

export default function AuditLogsView({ logs: initialLogs }: AuditLogsViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AuditLog | null
    direction: "asc" | "desc"
  }>({
    key: "timestamp",
    direction: "desc",
  })
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | null>(null)
  const [complianceFilter, setComplianceFilter] = useState<ComplianceStandard | null>(null)

  // Handle sorting
  const handleSort = (key: keyof AuditLog) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    })
  }

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...initialLogs]

    // Apply severity filter
    if (severityFilter !== null) {
      filtered = filtered.filter((log) => log.severity === severityFilter)
    }

    // Apply compliance filter
    if (complianceFilter !== null) {
      filtered = filtered.filter((log) => log.complianceStandards?.includes(complianceFilter))
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(term) ||
          log.user.toLowerCase().includes(term) ||
          log.resource.toLowerCase().includes(term) ||
          log.action.toLowerCase().includes(term),
      )
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [initialLogs, severityFilter, complianceFilter, searchTerm, sortConfig])

  // Reset all filters
  const resetFilters = () => {
    setSeverityFilter(null)
    setComplianceFilter(null)
    setSearchTerm("")
  }

  // Get severity icon based on level
  const getSeverityIcon = (severity: SeverityLevel) => {
    if (severity <= 1) return <ShieldAlert className="h-4 w-4" />
    if (severity <= 3) return <AlertCircle className="h-4 w-4" />
    if (severity <= 5) return <AlertTriangle className="h-4 w-4" />
    return <Info className="h-4 w-4" />
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Audit Logs</CardTitle>
        <CardDescription>View and analyze system activity logs with compliance information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  Severity
                  {severityFilter !== null && (
                    <Badge variant="secondary" className="ml-2">
                      {getSeverityLabel(severityFilter)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSeverityFilter(null)}>All Severities</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSeverityFilter(0)}>Emergency (0)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSeverityFilter(1)}>Alert (1)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSeverityFilter(2)}>Critical (2)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSeverityFilter(3)}>Error (3)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSeverityFilter(4)}>Warning (4)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSeverityFilter(5)}>Notice (5)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSeverityFilter(6)}>Informational (6)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSeverityFilter(7)}>Debug (7)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  Compliance
                  {complianceFilter && (
                    <Badge variant="secondary" className="ml-2">
                      {complianceFilter}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setComplianceFilter(null)}>All Standards</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setComplianceFilter("PCI-DSS")}>PCI-DSS</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setComplianceFilter("ISO-27001")}>ISO-27001</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setComplianceFilter("HIPAA")}>HIPAA</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setComplianceFilter("GDPR")}>GDPR</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {(severityFilter !== null || complianceFilter !== null || searchTerm) && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort("timestamp")}>
                  <div className="flex items-center">
                    Timestamp
                    {sortConfig.key === "timestamp" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("severity")}>
                  <div className="flex items-center">
                    Severity
                    {sortConfig.key === "severity" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("user")}>
                  <div className="flex items-center">
                    User
                    {sortConfig.key === "user" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("action")}>
                  <div className="flex items-center">
                    Action
                    {sortConfig.key === "action" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("resource")}>
                  <div className="flex items-center">
                    Resource
                    {sortConfig.key === "resource" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="max-w-[300px]">Message</TableHead>
                <TableHead>Compliance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedLogs.map((log) => (
                  <TableRow key={log.id} className={getSeverityColor(log.severity)}>
                    <TableCell className="font-mono text-xs">{formatDate(log.timestamp)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getSeverityIcon(log.severity)}
                        <span>{getSeverityLabel(log.severity)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{log.resource}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="line-clamp-2">{log.message}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {log.complianceStandards?.map((standard) => (
                          <Badge key={standard} variant="outline" className="text-xs">
                            {standard}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredAndSortedLogs.length} of {initialLogs.length} logs
        </div>
      </CardContent>
    </Card>
  )
}

