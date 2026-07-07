import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { BookOpen, AlertTriangle, Package, Shield, FileCheck, Mail, ScrollText as DecisionIcon, ClipboardList, DollarSign, ShieldCheck, Leaf, FolderLock, Receipt, Banknote, Landmark, HardHat } from "lucide-react";
import {
  risksApi,
  blocksApi,
  complianceApi,
  contractsApi,
  correspondenceApi,
  decisionsApi,
  operationsUpdatesApi,
  budgetLinesApi,
  insuranceApi,
  environmentalPermitsApi,
  ndasApi,
  vendorPaymentsApi,
  forexApi,
  localContentApi,
  hseApi,
  documentsApi,
} from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";

// Static catalogue of which registers exist, how they look, and where they
// link to. The actual entry counts and "last updated" dates are NOT stored
// here — they are fetched live from each register's own API in the effect
// below, keyed by `dataKey`, so this hub always reflects real database
// content instead of hardcoded numbers.
const registerCatalog = [
    {
      id: 1,
      dataKey: "risks",
      name: "Risk Register",
      description: "Track and manage project and operational risks",
      icon: AlertTriangle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
      href: "/registers/1",
    },
    {
      id: 2,
      dataKey: "blocks",
      name: "Asset Register",
      description: "Inventory of all exploration/production blocks (assets)",
      icon: Package,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/blocks",
    },
    {
      id: 3,
      dataKey: "compliance",
      name: "Compliance Register",
      description: "Statutory obligations, licence fees, royalties and filings",
      icon: Shield,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      href: "/compliance",
    },
    {
      id: 4,
      dataKey: "contracts",
      name: "Contract Register",
      description: "Manage all contracts and agreements with expiry/renewal alerts",
      icon: FileCheck,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/contracts",
    },
    {
      id: 5,
      dataKey: "hse",
      name: "Incident Register",
      description: "Log and track HSE incidents",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      href: "/hse",
    },
    {
      id: 6,
      dataKey: "documents",
      name: "Document Register",
      description: "Master index of all project documents",
      icon: BookOpen,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-100",
      href: "/documents",
    },
    {
      id: 7,
      dataKey: "correspondence",
      name: "PC / GNPC Correspondence Log",
      description: "Searchable register of inbound/outbound regulator correspondence",
      icon: Mail,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/correspondence",
    },
    {
      id: 8,
      dataKey: "decisions",
      name: "Decision Log",
      description: "Chronological record of key decisions and rationale",
      icon: DecisionIcon,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-100",
      href: "/decisions",
    },
    {
      id: 9,
      dataKey: "operationsUpdates",
      name: "Operations Update",
      description: "Periodic field/project status log per block/well",
      icon: ClipboardList,
      iconColor: "text-teal-600",
      bgColor: "bg-teal-100",
      href: "/operations-updates",
    },
    {
      id: 10,
      dataKey: "budgetLines",
      name: "Work Programme & Budget Tracker",
      description: "Approved work programme and budget per block, with variance and drill-down",
      icon: DollarSign,
      iconColor: "text-blue-700",
      bgColor: "bg-blue-100",
      href: "/budget-tracker",
    },
    {
      id: 11,
      dataKey: "insurance",
      name: "Insurance Register",
      description: "Insurance policies, coverage and renewal deadlines across the portfolio",
      icon: ShieldCheck,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/insurance",
    },
    {
      id: 12,
      dataKey: "environmentalPermits",
      name: "Environmental Permit Tracker",
      description: "EPA Ghana permits/approvals, conditions and renewal deadlines",
      icon: Leaf,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      href: "/environmental-permits",
    },
    {
      id: 13,
      dataKey: "ndas",
      name: "NDA & Data Room Tracker",
      description: "NDAs with counterparties and which data-room documents each may access",
      icon: FolderLock,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-100",
      href: "/nda-tracker",
    },
    {
      id: 14,
      dataKey: "vendorPayments",
      name: "Vendor Payment Aging",
      description: "Outstanding vendor invoices and their aging buckets",
      icon: Receipt,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/vendor-payments",
    },
    {
      id: 15,
      dataKey: "forex",
      name: "Forex & Banking Workflow",
      description: "FX conversions/settlements with a maker-checker approval gate",
      icon: Banknote,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
      href: "/forex",
    },
    {
      id: 16,
      dataKey: "localContent",
      name: "Local Content Tracking",
      description: "Ghanaian local-content commitments vs. actuals for Petroleum Commission reporting",
      icon: Landmark,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-100",
      href: "/local-content",
    },
    {
      id: 17,
      dataKey: "hse",
      name: "HSE Register",
      description: "HSE incidents/observations, corrective actions, and TRIR/LTIF safety metrics",
      icon: HardHat,
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      href: "/hse",
    },
  ];

// One fetcher per distinct data source. Several catalogue tiles above share
// the same dataKey (e.g. "Incident Register" and "HSE Register" both read
// from the HSE API) so each source is only fetched once.
const dataFetchers: Record<string, () => Promise<any[]>> = {
  risks: () => risksApi.getAll(),
  blocks: () => blocksApi.getAll(),
  compliance: () => complianceApi.getAll(),
  contracts: () => contractsApi.getAll(),
  hse: () => hseApi.getAll(),
  documents: () => documentsApi.getAll(),
  correspondence: () => correspondenceApi.getAll(),
  decisions: () => decisionsApi.getAll(),
  operationsUpdates: () => operationsUpdatesApi.getAll(),
  budgetLines: () => budgetLinesApi.getAll(),
  insurance: () => insuranceApi.getAll(),
  environmentalPermits: () => environmentalPermitsApi.getAll(),
  ndas: () => ndasApi.getAll(),
  vendorPayments: () => vendorPaymentsApi.getAll(),
  forex: () => forexApi.getAll(),
  localContent: () => localContentApi.getAll(),
};

interface RegisterStats {
  entries: number;
  lastUpdated: string | null;
}

export function Registers() {
  const [stats, setStats] = useState<Record<string, RegisterStats>>({});
  const [loading, setLoading] = useState(true);

  // Note: the backend's generic /api/registers table (name/type/value JSON)
  // is an unrelated key-value store and does not match the shape this hub
  // page renders. The catalogue below stays static (names/icons/links), but
  // entry counts and "last updated" are fetched live from each register's
  // own API so this hub always reflects real database content.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const results = await Promise.all(
        Object.entries(dataFetchers).map(async ([key, fetchAll]) => {
          try {
            const rows = await fetchAll();
            const list = Array.isArray(rows) ? rows : [];
            const lastUpdated = list.reduce<string | null>((latest, row) => {
              const ts = row?.updatedAt || row?.createdAt || null;
              if (!ts) return latest;
              if (!latest || new Date(ts).getTime() > new Date(latest).getTime()) return ts;
              return latest;
            }, null);
            return [key, { entries: list.length, lastUpdated }] as const;
          } catch (err) {
            console.error(`Error fetching register data for "${key}":`, err);
            return [key, { entries: 0, lastUpdated: null }] as const;
          }
        })
      );
      if (!cancelled) {
        setStats(Object.fromEntries(results));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toDateString();
  const totalEntries = registerCatalog.reduce((sum, r) => sum + (stats[r.dataKey]?.entries || 0), 0);
  const updatedToday = registerCatalog.filter((r) => {
    const lu = stats[r.dataKey]?.lastUpdated;
    return lu ? new Date(lu).toDateString() === today : false;
  }).length;
  const registersWithData = registerCatalog.filter((r) => (stats[r.dataKey]?.entries || 0) > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Registers</h1>
          <p className="text-gray-500 mt-1">Manage operational registers and records</p>
        </div>
        {loading && <span className="text-sm text-gray-500 animate-pulse">Loading live counts...</span>}
      </div>

      {/* Registers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {registerCatalog.map((register) => {
          const Icon = register.icon || BookOpen;
          const entries = stats[register.dataKey]?.entries ?? 0;
          const lastUpdated = stats[register.dataKey]?.lastUpdated ?? null;

          return (
            <Card key={register.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`${register.bgColor} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${register.iconColor}`} />
                </div>
                <Badge variant="outline">{loading ? '…' : entries} entries</Badge>
              </div>

              <h3 className="text-lg mb-2">{register.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{register.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                <span>Updated: {loading ? '…' : formatDisplayDateOrDefault(lastUpdated, 'No records yet')}</span>
              </div>

              <Link to={register.href}>
                <Button className="w-full mt-4">View Register</Button>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats — all derived from the live counts fetched above. */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">Register Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Registers</p>
            <p className="text-2xl mt-1">{registerCatalog.length}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Entries</p>
            <p className="text-2xl mt-1">{loading ? '…' : totalEntries}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Updated Today</p>
            <p className="text-2xl mt-1">{loading ? '…' : updatedToday}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Registers With Data</p>
            <p className="text-2xl mt-1">{loading ? '…' : registersWithData}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
