import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const BASE_URL = "http://localhost:8000/api/v1";

export function FuelLogs() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: '',
    trip_id: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  // ================= FETCH ALL DATA =================
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Session expired. Please login again.");
        return;
      }

      const [logsRes, vehiclesRes, tripsRes, driversRes] = await Promise.all([
        fetch(`${BASE_URL}/fuel-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/trips`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/drivers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const logsData = await logsRes.json();
      const vehiclesData = await vehiclesRes.json();
      const tripsData = await tripsRes.json();
      const driversData = await driversRes.json();

      if (!logsRes.ok || !logsData.success)
        throw new Error(logsData.message);

      setLogs(logsData.data.logs || []);
      setVehicles(vehiclesData.data?.vehicles || []);
      setTrips(tripsData.data?.trips || []);
      setDrivers(driversData.data?.drivers || []);

    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // ================= CREATE FUEL LOG =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/fuel-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_id: formData.vehicle_id,
          trip_id: formData.trip_id || null,
          cost: parseFloat(formData.cost),
          date: formData.date,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create fuel log");
      }

      toast.success(result.message);
      setIsDialogOpen(false);
      resetForm();
      fetchData();

    } catch (error) {
      console.error("Create log error:", error);
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      trip_id: '',
      cost: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const getVehicle = (id) =>
    vehicles.find(v => v.id === id);

  const getTrip = (id) =>
    trips.find(t => t.id === id);

  const getDriver = (id) =>
    drivers.find(d => d.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Fuel & Expense Logs
        </h1>
        <p className="text-gray-500 mt-1">
          Track fuel consumption and operational costs
        </p>
      </div>

      {/* Add Fuel Log */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Fuel Log
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Fuel Log</DialogTitle>
              <DialogDescription>
                Add a new fuel expense entry.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">

              <div className="space-y-2">
                <Label>Vehicle *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(val) =>
                    setFormData({ ...formData, vehicle_id: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} ({vehicle.license_plate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trip (Optional)</Label>
                <Select
                  value={formData.trip_id}
                  onValueChange={(val) =>
                    setFormData({ ...formData, trip_id: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map(trip => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.origin} → {trip.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fuel Cost (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>

            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fuel Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Fuel Entries ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No fuel logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => {
                  const vehicle = getVehicle(log.vehicle_id);
                  const trip = getTrip(log.trip_id);
                  const driver = trip
                    ? getDriver(trip.driver_id)
                    : null;

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        {vehicle?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {driver?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {trip
                          ? `${trip.origin} → ${trip.destination}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        ₹{log.cost.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.date), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}