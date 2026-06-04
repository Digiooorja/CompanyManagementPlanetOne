import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "../components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Search, Plus } from "lucide-react";
import { blocksApi, licencesApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

export function Blocks() {
  const { canEdit } = useAuth();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [licences, setLicences] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBlock, setNewBlock] = useState({
    name: '',
    description: '',
    status: 'Active',
    operator: '',
    workingInterest: '',
    area: '',
    location: ''
  });
  const [createLicence, setCreateLicence] = useState(false);
  const [newLicence, setNewLicence] = useState({
    licenceNumber: '',
    licenceType: 'Exploration',
    issuedBy: '',
    startDate: '',
    expiryDate: '',
    status: 'Active'
  });

  const handleCreateBlock = async () => {
    if (!newBlock.name.trim() || !newBlock.description.trim()) {
      setError('Block name and description are required.');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      await blocksApi.create({
        name: newBlock.name,
        description: newBlock.description,
        status: newBlock.status,
        operator: newBlock.operator || undefined,
        workingInterest: newBlock.workingInterest || undefined,
        area: newBlock.area || undefined,
        location: newBlock.location || undefined,
        newLicence: createLicence ? newLicence : undefined
      });

      setIsCreateOpen(false);
      setNewBlock({
        name: '',
        description: '',
        status: 'Active',
        operator: '',
        workingInterest: '',
        area: '',
        location: ''
      });
      setCreateLicence(false);
      setNewLicence({
        licenceNumber: '',
        licenceType: 'Exploration',
        issuedBy: '',
        startDate: '',
        expiryDate: '',
        status: 'Active'
      });

      const [data, lData] = await Promise.all([blocksApi.getAll(), licencesApi.getAll()]);
      setBlocks(Array.isArray(data) ? data : []);
      setLicences(Array.isArray(lData) ? lData : []);
    } catch (err) {
      console.error('Create block error:', err);
      setError('Unable to create block. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, lData] = await Promise.all([
          blocksApi.getAll(),
          licencesApi.getAll()
        ]);
        setBlocks(Array.isArray(data) ? data : []);
        setLicences(Array.isArray(lData) ? lData : []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Unable to load data from the database.');
        setBlocks([]);
        setLicences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  useEffect(() => {
    const handler = (e: any) => setSearchQuery(e?.detail?.query || "");
    window.addEventListener('globalSearch', handler as EventListener);
    return () => window.removeEventListener('globalSearch', handler as EventListener);
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredBlocks = normalizedSearch
    ? blocks.filter((b) => [b.name, b.operator, b.area, b.location]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : blocks;

  const getActiveLicences = (blockId: number) => {
    return licences.filter(l => 
      l.status === 'Active' && 
      Array.isArray(l.blockIds) && 
      l.blockIds.includes(blockId)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "Planning":
        return "secondary";
      case "Exploration":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Blocks</h1>
          <p className="text-gray-500 mt-1">Manage exploration and production blocks</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canEdit}>
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Block</DialogTitle>
              <DialogDescription>Add a new block to your portfolio.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newBlock.name}
                  onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newBlock.description}
                  onChange={(e) => setNewBlock({ ...newBlock, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={newBlock.status}
                  onChange={(e) => setNewBlock({ ...newBlock, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Operator</Label>
                  <Input
                    value={newBlock.operator}
                    onChange={(e) => setNewBlock({ ...newBlock, operator: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Working Interest</Label>
                  <Input
                    value={newBlock.workingInterest}
                    onChange={(e) => setNewBlock({ ...newBlock, workingInterest: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Area</Label>
                  <Input
                    value={newBlock.area}
                    onChange={(e) => setNewBlock({ ...newBlock, area: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={newBlock.location}
                    onChange={(e) => setNewBlock({ ...newBlock, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="createLicence"
                    checked={createLicence}
                    onChange={(e) => setCreateLicence(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="createLicence" className="cursor-pointer font-medium">Link Initial Licence (Optional)</Label>
                </div>

                {createLicence && (
                  <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                    <div>
                      <Label>Licence Number</Label>
                      <Input
                        value={newLicence.licenceNumber}
                        onChange={(e) => setNewLicence({ ...newLicence, licenceNumber: e.target.value })}
                        placeholder="e.g. EXPL-2026-001"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Licence Type</Label>
                        <select
                          className="w-full rounded-md border px-3 py-2"
                          value={newLicence.licenceType}
                          onChange={(e) => setNewLicence({ ...newLicence, licenceType: e.target.value })}
                        >
                          <option value="Exploration">Exploration</option>
                          <option value="Production">Production</option>
                          <option value="Environmental">Environmental</option>
                          <option value="Drilling">Drilling</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>
                      <div>
                        <Label>Issued By</Label>
                        <Input
                          value={newLicence.issuedBy}
                          onChange={(e) => setNewLicence({ ...newLicence, issuedBy: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={newLicence.startDate}
                          onChange={(e) => setNewLicence({ ...newLicence, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Expiry Date</Label>
                        <Input
                          type="date"
                          value={newLicence.expiryDate}
                          onChange={(e) => setNewLicence({ ...newLicence, expiryDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Operator</Label>
                  <Input
                    value={newBlock.operator}
                    onChange={(e) => setNewBlock({ ...newBlock, operator: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Working Interest</Label>
                  <Input
                    value={newBlock.workingInterest}
                    onChange={(e) => setNewBlock({ ...newBlock, workingInterest: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Area</Label>
                <Input
                  value={newBlock.area}
                  onChange={(e) => setNewBlock({ ...newBlock, area: e.target.value })}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={newBlock.location}
                  onChange={(e) => setNewBlock({ ...newBlock, location: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateBlock} disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search blocks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">Filter</Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading blocks...</p>
        </Card>
      ) : (
        <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active Licences</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Working Interest</TableHead>
              <TableHead>Area</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBlocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                  No blocks found in the database.
                </TableCell>
              </TableRow>
            ) : (
              filteredBlocks.map((block) => {
                const activeLics = getActiveLicences(block.id);
                return (
                  <TableRow key={block.id}>
                    <TableCell>
                      <Link
                        to={`/blocks/${block.id}`}
                        className="hover:underline font-medium text-primary"
                      >
                        {block.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(block.status)}>
                        {block.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {activeLics.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {activeLics.map(l => (
                            <Badge key={l.id} variant="outline" className="text-xs">
                              {l.licenceNumber}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {block.operator}
                    </TableCell>
                    <TableCell>{block.workingInterest}</TableCell>
                    <TableCell>{block.area}</TableCell>
                    <TableCell>
                      <Link to={`/blocks/${block.id}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
      )}
    </div>
  );
}
