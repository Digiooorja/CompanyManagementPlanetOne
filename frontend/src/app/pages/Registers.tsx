import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { BookOpen, AlertTriangle, Package, Shield, FileCheck, Mail, ScrollText as DecisionIcon, ClipboardList, DollarSign } from "lucide-react";
import { registersApi } from "../../services/api";

const defaultRegisters = [
    {
      id: 1,
      name: "Risk Register",
      description: "Track and manage project and operational risks",
      icon: AlertTriangle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
      entries: 47,
      lastUpdated: "2026-04-30",
      blocks: ["Block A", "Block B", "Block C"],
    },
    {
      id: 2,
      name: "Asset Register",
      description: "Inventory of all equipment and assets",
      icon: Package,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      entries: 156,
      lastUpdated: "2026-05-01",
      blocks: ["Block A", "Block B", "Block C", "Block D"],
    },
    {
      id: 3,
      name: "Compliance Register",
      description: "Statutory obligations, licence fees, royalties and filings",
      icon: Shield,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      entries: 89,
      lastUpdated: "2026-04-29",
      blocks: ["Block A", "Block B", "Block C"],
      href: "/compliance",
    },
    {
      id: 4,
      name: "Contract Register",
      description: "Manage all contracts and agreements with expiry/renewal alerts",
      icon: FileCheck,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      entries: 34,
      lastUpdated: "2026-04-28",
      blocks: ["Block A", "Block B"],
      href: "/contracts",
    },
    {
      id: 5,
      name: "Incident Register",
      description: "Log and track HSE incidents",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      entries: 12,
      lastUpdated: "2026-05-01",
      blocks: ["Block A", "Block B", "Block C", "Block D"],
    },
    {
      id: 6,
      name: "Document Register",
      description: "Master index of all project documents",
      icon: BookOpen,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-100",
      entries: 234,
      lastUpdated: "2026-05-01",
      blocks: ["Block A", "Block B", "Block C"],
    },
    {
      id: 7,
      name: "PC / GNPC Correspondence Log",
      description: "Searchable register of inbound/outbound regulator correspondence",
      icon: Mail,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      entries: 0,
      lastUpdated: "2026-05-01",
      blocks: [] as string[],
      href: "/correspondence",
    },
    {
      id: 8,
      name: "Decision Log",
      description: "Chronological record of key decisions and rationale",
      icon: DecisionIcon,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-100",
      entries: 0,
      lastUpdated: "2026-05-01",
      blocks: [] as string[],
      href: "/decisions",
    },
    {
      id: 9,
      name: "Operations Update",
      description: "Periodic field/project status log per block/well",
      icon: ClipboardList,
      iconColor: "text-teal-600",
      bgColor: "bg-teal-100",
      entries: 0,
      lastUpdated: "2026-05-01",
      blocks: [] as string[],
      href: "/operations-updates",
    },
    {
      id: 10,
      name: "Work Programme & Budget Tracker",
      description: "Approved work programme and budget per block, with variance and drill-down",
      icon: DollarSign,
      iconColor: "text-blue-700",
      bgColor: "bg-blue-100",
      entries: 0,
      lastUpdated: "2026-05-01",
      blocks: [] as string[],
      href: "/budget-tracker",
    },
  ];

export function Registers() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegisters = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await registersApi.getAll();
        if (data && data.length > 0) {
          setRegisters(data);
        } else {
          setRegisters(defaultRegisters);
        }
      } catch (err) {
        console.error('Error fetching registers:', err);
        setRegisters(defaultRegisters);
      } finally {
        setLoading(false);
      }
    };

    fetchRegisters();
  }, []);

  const renderedRegisters = registers.length > 0 ? registers : defaultRegisters;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Registers</h1>
          <p className="text-gray-500 mt-1">Manage operational registers and records</p>
        </div>
      </div>

      {/* Registers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderedRegisters.map((register) => {
          const Icon = register.icon || BookOpen;
          const iconColor = register.iconColor || "text-slate-600";
          const bgColor = register.bgColor || "bg-slate-100";
          const entries = register.entries ?? 0;
          const blocks = Array.isArray(register.blocks) ? register.blocks : [register.blocks].filter(Boolean);

          return (
            <Card key={register.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`${bgColor} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <Badge variant="outline">{entries} entries</Badge>
              </div>
              
              <h3 className="text-lg mb-2">{register.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{register.description}</p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Blocks:</p>
                  <div className="flex flex-wrap gap-1">
                    {register.blocks.map((block: any, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {block}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                  <span>Updated: {register.lastUpdated}</span>
                </div>
              </div>
              
              <Link to={register.href || `/registers/${register.id}`}>
                <Button className="w-full mt-4">View Register</Button>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">Register Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Registers</p>
            <p className="text-2xl mt-1">{registers.length}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Entries</p>
            <p className="text-2xl mt-1">
              {registers.reduce((sum, r) => sum + r.entries, 0)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Updated Today</p>
            <p className="text-2xl mt-1">3</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Requires Review</p>
            <p className="text-2xl mt-1">8</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
