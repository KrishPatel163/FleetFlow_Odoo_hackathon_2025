import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const BASE_URL = "http://localhost:8000/api/v1";

export function TripDispatcher() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    origin: '',
    destination: '',
    cargo_weight: '',
    distance: '',
    revenue: '',
    status: 'draft',
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

      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        fetch(`${BASE_URL}/trips`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/drivers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const tripsData = await tripsRes.json();
      const vehiclesData = await vehiclesRes.json();
      const driversData = await driversRes.json();

      if (!tripsRes.ok || !tripsData.success)
        throw new Error(tripsData.message);

      setTrips(tripsData.data.trips || []);
      setVehicles(vehiclesData.data?.vehicles || []);
      setDrivers(driversData.data?.drivers || []);

    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const availableVehicles = vehicles.filter(
    v => v.status === 'available' || v.status === 'on_trip'
  );

  const availableDrivers = drivers.filter(d => {
    const licenseExpiry = new Date(d.license_expiry);
    return d.status === 'on_duty' && licenseExpiry >= new Date();
  });

  const handleVehicleSelect = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    setSelectedVehicle(vehicle || null);
    setFormData({ ...formData, vehicle_id: vehicleId });
  };

  // ================= CREATE TRIP =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in");
      return;
    }

    if (!formData.vehicle_id || !formData.driver_id ||
        !formData.origin || !formData.destination ||
        !formData.cargo_weight) {
      toast.error("Please fill all required fields");
      return;
    }

    if (selectedVehicle &&
        parseFloat(formData.cargo_weight) > selectedVehicle.max_capacity) {
      toast.error("Cargo exceeds vehicle capacity");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_id: formData.vehicle_id,
          driver_id: formData.driver_id,
          origin: formData.origin,
          destination: formData.destination,
          cargo_weight: parseFloat(formData.cargo_weight),
          distance: formData.distance
            ? parseFloat(formData.distance)
            : null,
          revenue: formData.revenue
            ? parseFloat(formData.revenue)
            : null,
          status: formData.status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success)
        throw new Error(result.message);

      toast.success(result.message);
      setIsDialogOpen(false);
      resetForm();
      fetchData();

    } catch (error) {
      console.error("Create trip error:", error);
      toast.error(error.message);
    }
  };

  // ================= UPDATE STATUS =================
  const handleStatusUpdate = async (tripId, newStatus) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      const updateData = { status: newStatus };

      if (newStatus === "dispatched")
        updateData.dispatched_at = new Date().toISOString();

      if (newStatus === "completed")
        updateData.completed_at = new Date().toISOString();

      const response = await fetch(`${BASE_URL}/trips/${tripId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok || !result.success)
        throw new Error(result.message);

      toast.success(result.message);
      fetchData();

    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      driver_id: '',
      origin: '',
      destination: '',
      cargo_weight: '',
      distance: '',
      revenue: '',
      status: 'draft',
    });
    setSelectedVehicle(null);
  };

  const getStatusBadge = (status) => (
    <Badge>{status}</Badge>
  );

  const getVehicleName = (id) =>
    vehicles.find(v => v.id === id)?.name || "Unknown";

  const getDriverName = (id) =>
    drivers.find(d => d.id === id)?.name || "Unknown";

  const filteredTrips = trips
    .filter(trip =>
      statusFilter === "all" || trip.status === statusFilter
    )
    .filter(trip =>
      trip.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Trip Dispatcher</h1>

      <Card>
        <CardHeader>
          <CardTitle>Trips ({trips.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map(trip => (
                <TableRow key={trip.id}>
                  <TableCell>{getVehicleName(trip.vehicle_id)}</TableCell>
                  <TableCell>{getDriverName(trip.driver_id)}</TableCell>
                  <TableCell>{trip.origin}</TableCell>
                  <TableCell>{trip.destination}</TableCell>
                  <TableCell>{getStatusBadge(trip.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}