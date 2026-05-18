import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Search, Plus } from "lucide-react";
import { blocksApi } from "../../services/api";

export function Blocks() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await blocksApi.getAll();
        setBlocks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching blocks:', err);
        setError('Unable to load blocks from the database.');
        setBlocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date("2026-05-01");
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Block
        </Button>
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
              <TableHead>Licence Start</TableHead>
              <TableHead>Licence Expiry</TableHead>
              <TableHead>Days Until Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Working Interest</TableHead>
              <TableHead>Area</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                  No blocks found in the database.
                </TableCell>
              </TableRow>
            ) : (
              blocks.map((block) => {
                const daysLeft = getDaysUntilExpiry(block.licenceExpiry);
                return (
                  <TableRow key={block.id}>
                    <TableCell>
                      <Link
                        to={`/blocks/${block.id}`}
                        className="hover:underline"
                      >
                        {block.name}
                      </Link>
                    </TableCell>
                    <TableCell>{block.licenceStart}</TableCell>
                    <TableCell>{block.licenceExpiry}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          daysLeft < 90
                            ? "destructive"
                            : daysLeft < 180
                            ? "default"
                            : "outline"
                        }
                      >
                        {daysLeft} days
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(block.status)}>
                        {block.status}
                      </Badge>
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
