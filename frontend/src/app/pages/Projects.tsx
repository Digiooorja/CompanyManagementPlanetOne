import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Search, Plus, Filter, Pencil } from "lucide-react";
import { Progress } from "../components/ui/progress";
import { blocksApi, projectsApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

export function Projects() {
  const { canEdit } = useAuth();
  const [searchParams] = useSearchParams();
  // §5.8 guaranteed drill-down: pre-apply block/status filters forwarded via
  // query params from the Executive Dashboard's filter bar.
  const [filterBlock, setFilterBlock] = useState(searchParams.get("blockId") || "all");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "all");
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'In Progress',
    blockId: '',
    manager: '',
    budget: '',
    completion: '',
    plannedStartDate: '',
    plannedEndDate: ''
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editProject, setEditProject] = useState({
    name: '',
    description: '',
    status: 'In Progress',
    blockId: '',
    manager: '',
    budget: '',
    completion: '',
    plannedStartDate: '',
    plannedEndDate: ''
  });

  const handleEditClick = (project: any) => {
    setEditingProjectId(project.id);
    setEditProject({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'In Progress',
      blockId: project.blockId ? String(project.blockId) : '',
      manager: project.manager || '',
      budget: project.budget !== undefined && project.budget !== null ? String(project.budget) : '',
      completion: project.completion !== undefined && project.completion !== null ? String(project.completion) : '',
      plannedStartDate: project.startDate ? String(project.startDate).slice(0, 10) : '',
      plannedEndDate: project.endDate ? String(project.endDate).slice(0, 10) : '',
    });
    setError(null);
    setIsEditOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProjectId) return;
    if (!editProject.name.trim() || !editProject.description.trim()) {
      setError('Project name and description are required.');
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      const selectedBlock = blocks.find((block) => String(block.id) === editProject.blockId);

      await projectsApi.update(editingProjectId, {
        name: editProject.name,
        description: editProject.description,
        status: editProject.status,
        blockId: editProject.blockId && editProject.blockId !== 'none' ? Number(editProject.blockId) : undefined,
        block: selectedBlock?.name,
        manager: editProject.manager || undefined,
        budget: editProject.budget !== '' ? Number(editProject.budget) : undefined,
        completion: editProject.completion !== '' ? Number(editProject.completion) : undefined,
        startDate: editProject.plannedStartDate || undefined,
        endDate: editProject.plannedEndDate || undefined,
      });

      setIsEditOpen(false);
      setEditingProjectId(null);

      const data = await projectsApi.getAll();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Update project error:', err);
      setError('Unable to update project. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.description.trim()) {
      setError('Project name and description are required.');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const selectedBlock = blocks.find((block) => String(block.id) === newProject.blockId);

      await projectsApi.create({
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        blockId: newProject.blockId && newProject.blockId !== 'none' ? Number(newProject.blockId) : undefined,
        block: selectedBlock?.name,
        manager: newProject.manager || undefined,
        budget: newProject.budget ? Number(newProject.budget) : undefined,
        completion: newProject.completion !== '' ? Number(newProject.completion) : undefined,
        startDate: newProject.plannedStartDate || undefined,
        endDate: newProject.plannedEndDate || undefined,
      });

      setIsCreateOpen(false);
      setNewProject({
        name: '',
        description: '',
        status: 'In Progress',
        blockId: '',
        manager: '',
        budget: '',
        completion: '',
        plannedStartDate: '',
        plannedEndDate: ''
      });

      const data = await projectsApi.getAll();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Create project error:', err);
      setError('Unable to create project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await projectsApi.getAll();
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Unable to load projects from the database.');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchBlocks = async () => {
      try {
        const blockData = await blocksApi.getAll();
        setBlocks(Array.isArray(blockData) ? blockData : []);
      } catch (err) {
        console.error('Error fetching blocks:', err);
        setBlocks([]);
      }
    };

    fetchProjects();
    fetchBlocks();
  }, []);

  useEffect(() => {
    const handler = (e: any) => setSearchQuery(e?.detail?.query || "");
    window.addEventListener('globalSearch', handler as EventListener);
    return () => window.removeEventListener('globalSearch', handler as EventListener);
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const renderedProjects = projects.filter((project) => {
    if (filterBlock !== 'all' && String(project.blockId) !== String(filterBlock)) {
      return false;
    }
    if (filterStatus !== 'all' && filterStatus) {
      if (String(project.status).toLowerCase() !== String(filterStatus).toLowerCase()) {
        return false;
      }
    }
    if (!normalizedSearch) return true;
    const text = [project.name, project.block, project.manager, project.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return text.includes(normalizedSearch);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "Completed":
        return "secondary";
      case "Planning":
        return "outline";
      case "On Hold":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Projects</h1>
          <p className="text-gray-500 mt-1">Manage projects across all blocks</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canEdit}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>Fill out the details to add a new project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Project Name</Label>
                <Input
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Block</Label>
                <Select
                  value={newProject.blockId}
                  onValueChange={(value) => setNewProject({ ...newProject, blockId: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a block" />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks.length === 0 ? (
                      <SelectItem value="none">No blocks available</SelectItem>
                    ) : (
                      blocks.map((block) => (
                        <SelectItem key={block.id} value={String(block.id)}>
                          {block.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Active">Active</option>
                  <option value="Planning">Planning</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Planned Start Date</Label>
                  <Input
                    type="date"
                    value={newProject.plannedStartDate}
                    onChange={(e) => setNewProject({ ...newProject, plannedStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Planned End Date</Label>
                  <Input
                    type="date"
                    value={newProject.plannedEndDate}
                    onChange={(e) => setNewProject({ ...newProject, plannedEndDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Manager</Label>
                <Input
                  value={newProject.manager}
                  onChange={(e) => setNewProject({ ...newProject, manager: e.target.value })}
                  placeholder="Project manager"
                />
              </div>
              <div>
                <Label>Budget</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                  placeholder="Budget amount"
                />
              </div>
              <div>
                <Label>Completion %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newProject.completion}
                  onChange={(e) => setNewProject({ ...newProject, completion: e.target.value })}
                  placeholder="0-100 (optional — leave blank to auto-calculate from activities)"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateProject} disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Project dialog — opened via the pencil icon on each row below. */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project's details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Project Name</Label>
              <Input
                value={editProject.name}
                onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Block</Label>
              <Select
                value={editProject.blockId}
                onValueChange={(value) => setEditProject({ ...editProject, blockId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a block" />
                </SelectTrigger>
                <SelectContent>
                  {blocks.length === 0 ? (
                    <SelectItem value="none">No blocks available</SelectItem>
                  ) : (
                    blocks.map((block) => (
                      <SelectItem key={block.id} value={String(block.id)}>
                        {block.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={editProject.status}
                onChange={(e) => setEditProject({ ...editProject, status: e.target.value })}
              >
                <option value="In Progress">In Progress</option>
                <option value="Active">Active</option>
                <option value="Planning">Planning</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Planned Start Date</Label>
                <Input
                  type="date"
                  value={editProject.plannedStartDate}
                  onChange={(e) => setEditProject({ ...editProject, plannedStartDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Planned End Date</Label>
                <Input
                  type="date"
                  value={editProject.plannedEndDate}
                  onChange={(e) => setEditProject({ ...editProject, plannedEndDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Manager</Label>
              <Input
                value={editProject.manager}
                onChange={(e) => setEditProject({ ...editProject, manager: e.target.value })}
                placeholder="Project manager"
              />
            </div>
            <div>
              <Label>Budget</Label>
              <Input
                type="number"
                step="0.01"
                value={editProject.budget}
                onChange={(e) => setEditProject({ ...editProject, budget: e.target.value })}
                placeholder="Budget amount"
              />
            </div>
            <div>
              <Label>Completion %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={editProject.completion}
                onChange={(e) => setEditProject({ ...editProject, completion: e.target.value })}
                placeholder="0-100"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editProject.description}
                onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateProject} disabled={updating}>
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading projects...</p>
        </Card>
      ) : (
        <>
          {/* Search and Filters */}
          <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterBlock} onValueChange={setFilterBlock}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by block" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blocks</SelectItem>
              {blocks.map((block) => (
                <SelectItem key={block.id} value={String(block.id)}>
                  {block.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="on hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Projects Table */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Completion</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderedProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  No projects found in the database.
                </TableCell>
              </TableRow>
            ) : (
              renderedProjects.map((project) => (
                <TableRow key={project.id}>
                <TableCell>
                  <Link
                    to={`/projects/${project.id}`}
                    className="hover:underline"
                  >
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{project.block}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatDisplayDateOrDefault(project.startDate)} - {formatDisplayDateOrDefault(project.endDate)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      ${(project.spent / 1000000).toFixed(1)}M / $
                      {(project.budget / 1000000).toFixed(1)}M
                    </div>
                    <Progress
                      value={(project.spent / project.budget) * 100}
                      className="h-1 w-24"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.completion} className="h-2 w-16" />
                    <span className="text-sm">{project.completion}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {project.manager}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" disabled={!canEdit} onClick={() => handleEditClick(project)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Link to={`/projects/${project.id}`}>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </Card>
        </>
      )}
    </div>
  );
}
