import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/supabase';
import { getAccessToken } from '../lib/auth';
import { publicAnonKey } from '/utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Wrench, AlertCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

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

  const fetchData = async () => {
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        fetch(`${apiUrl}/maintenance-logs`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
        fetch(`${apiUrl}/vehicles`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
      ]);

      const [logsData, vehiclesData] = await Promise.all([
        logsRes.json(),
        vehiclesRes.json(),
      ]);

      setLogs(logsData.logs || []);
      setVehicles(vehiclesData.vehicles || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await getAccessToken();

    if (!token) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/maintenance-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_id: formData.vehicle_id,
          description: formData.description,
          cost: parseFloat(formData.cost),
          date: formData.date,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create maintenance log');
      }

      toast.success('Maintenance log created successfully');
      if (formData.status === 'in_progress') {
        toast.info('Vehicle status updated to "In Shop"');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating maintenance log:', error);
      toast.error(error.message || 'Failed to create maintenance log');
    }
  };

  const handleStatusUpdate = async (logId, newStatus) => {
    const token = await getAccessToken();
    if (!token) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/maintenance-logs/${logId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update maintenance log');
      }

      toast.success(`Maintenance status updated to ${newStatus}`);
      if (newStatus === 'completed') {
        toast.info('Vehicle status updated to "Available"');
      }
      fetchData();
    } catch (error) {
      console.error('Error updating maintenance log:', error);
      toast.error('Failed to update maintenance log');
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_progress: { label: 'In Progress', variant: 'default' },
      completed: { label: 'Completed', variant: 'default' },
      scheduled: { label: 'Scheduled', variant: 'secondary' },
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.license_plate})` : 'Unknown';
  };

  const totalMaintenanceCost = logs.reduce((sum, log) => sum + log.cost, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredLogs = logs
    .filter(log => statusFilter === 'all' || log.status === statusFilter)
    .filter(log => log.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Maintenance & Service Logs</h1>
        <p className="text-gray-500 mt-1">Track preventative and reactive vehicle health</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Maintenance Logs</p>
                <p className="text-3xl font-bold mt-2">{logs.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold mt-2">
                  {logs.filter(l => l.status === 'in_progress').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-3xl font-bold mt-2">₹{totalMaintenanceCost.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium block mb-3">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block mb-3">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Most Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Maintenance Log Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Maintenance Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Maintenance Log</DialogTitle>
              <DialogDescription>
                Add a new maintenance log to track vehicle health and service history.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_id">Select Vehicle</Label>
                <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} ({vehicle.license_plate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the maintenance work..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost (₹)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Log</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Service History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Log ID</TableHead>
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
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No maintenance logs found. Add your first log to track vehicle health.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.id.substring(0, 8)}</TableCell>
                      <TableCell className="font-medium">{getVehicleName(log.vehicle_id)}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.description}</TableCell>
                      <TableCell>₹{log.cost.toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(log.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
