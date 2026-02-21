import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const BASE_URL = "http://localhost:8000/api/v1";

export function MaintenanceLogs() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const [formData, setFormData] = useState({
    vehicle_id: '',
    description: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    status: 'in_progress',
  });

  useEffect(() => {
    fetchData();
  }, []);

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Session expired. Please login again.");
        return;
      }

      const [logsRes, vehiclesRes] = await Promise.all([
        fetch(`${BASE_URL}/maintenance-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const logsData = await logsRes.json();
      const vehiclesData = await vehiclesRes.json();

      if (!logsRes.ok || !logsData.success) {
        throw new Error(logsData.message || "Failed to fetch maintenance logs");
      }

      if (!vehiclesRes.ok || !vehiclesData.success) {
        throw new Error(vehiclesData.message || "Failed to fetch vehicles");
      }

      setLogs(logsData.data.logs || []);
      setVehicles(vehiclesData.data.vehicles || []);

    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // ================= CREATE LOG =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/maintenance-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_id: formData.vehicle_id,
          description: formData.description,
          cost: parseFloat(formData.cost),
          date: formData.date,
          status: formData.status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create maintenance log");
      }

      toast.success(result.message);

      if (formData.status === "in_progress") {
        toast.info('Vehicle status updated to "In Shop"');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();

    } catch (error) {
      console.error("Create error:", error);
      toast.error(error.message);
    }
  };

  // ================= UPDATE STATUS =================
  const handleStatusUpdate = async (logId, newStatus) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/maintenance-logs/${logId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update maintenance log");
      }

      toast.success(result.message);

      if (newStatus === "completed") {
        toast.info('Vehicle status updated to "Available"');
      }

      fetchData();

    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      description: '',
      cost: '',
      date: new Date().toISOString().split('T')[0],
      status: 'in_progress',
    });
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.license_plate})` : 'Unknown';
  };

  const getStatusBadge = (status) => {
    const map = {
      scheduled: "secondary",
      in_progress: "default",
      completed: "default",
    };
    return <Badge variant={map[status] || "default"}>{status}</Badge>;
  };

  const totalMaintenanceCost = logs.reduce((sum, log) => sum + Number(log.cost), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredLogs = logs
    .filter(log => statusFilter === 'all' || log.status === statusFilter)
    .filter(log => log.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Maintenance & Service Logs
        </h1>
        <p className="text-gray-500 mt-1">
          Track preventative and reactive vehicle health
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">Total Maintenance Logs</p>
          <p className="text-3xl font-bold">{logs.length}</p>
          <p className="mt-4 text-sm text-gray-600">
            Total Cost: ₹{totalMaintenanceCost.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No maintenance logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getVehicleName(log.vehicle_id)}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>₹{Number(log.cost).toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(log.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}