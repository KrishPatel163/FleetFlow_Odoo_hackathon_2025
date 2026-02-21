import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/supabase';
import { getAccessToken } from '../lib/auth';
import { publicAnonKey } from '/utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, MapPin, AlertCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

export function TripDispatcher() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
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
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        fetch(`${apiUrl}/trips`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
        fetch(`${apiUrl}/vehicles`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
        fetch(`${apiUrl}/drivers`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
      ]);

      const [tripsData, vehiclesData, driversData] = await Promise.all([
        tripsRes.json(),
        vehiclesRes.json(),
        driversRes.json(),
      ]);

      setTrips(tripsData.trips || []);
      setVehicles(vehiclesData.vehicles || []);
      setDrivers(driversData.drivers || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const availableVehicles = vehicles.filter(v => 
    v.status === 'available' || v.status === 'on_trip'
  );

  const availableDrivers = drivers.filter(d => {
    const licenseExpiry = new Date(d.license_expiry);
    const today = new Date();
    return d.status === 'on_duty' && licenseExpiry >= today;
  });

  const handleVehicleSelect = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    setSelectedVehicle(vehicle || null);
    setFormData({ ...formData, vehicle_id: vehicleId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await getAccessToken();

    if (!token) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    // Validate required fields
    if (!formData.vehicle_id || !formData.driver_id || !formData.origin || 
        !formData.destination || !formData.cargo_weight) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validation: Check cargo weight against vehicle capacity
    if (selectedVehicle && parseFloat(formData.cargo_weight) > selectedVehicle.max_capacity) {
      toast.error(
        `Cargo weight (${formData.cargo_weight} kg) exceeds vehicle max capacity (${selectedVehicle.max_capacity} kg)`
      );
      return;
    }

    try {
      console.log('Creating trip with data:', {
        vehicle_id: formData.vehicle_id,
        driver_id: formData.driver_id,
        origin: formData.origin,
        destination: formData.destination,
        cargo_weight: parseFloat(formData.cargo_weight),
        distance: formData.distance ? parseFloat(formData.distance) : undefined,
        revenue: formData.revenue ? parseFloat(formData.revenue) : undefined,
        status: formData.status,
      });

      const response = await fetch(`${apiUrl}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_id: formData.vehicle_id,
          driver_id: formData.driver_id,
          origin: formData.origin,
          destination: formData.destination,
          cargo_weight: parseFloat(formData.cargo_weight),
          distance: formData.distance ? parseFloat(formData.distance) : undefined,
          revenue: formData.revenue ? parseFloat(formData.revenue) : undefined,
          status: formData.status,
        }),
      });

      console.log('Trip creation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Trip creation error:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        throw new Error(errorData.error || 'Failed to create trip');
      }

      toast.success('Trip created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating trip:', error);
      console.error('Error details:', error.message);
      toast.error(error.message || 'Failed to create trip');
    }
  };

  const handleStatusUpdate = async (tripId, newStatus) => {
    const token = await getAccessToken();
    if (!token) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'dispatched') {
        updateData.dispatched_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const response = await fetch(`${apiUrl}/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update trip status');
      }

      toast.success(`Trip status updated to ${newStatus}`);
      fetchData();
    } catch (error) {
      console.error('Error updating trip status:', error);
      toast.error('Failed to update trip status');
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' },
      dispatched: { label: 'Dispatched', variant: 'default' },
      completed: { label: 'Completed', variant: 'default' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.license_plate})` : 'Unknown';
  };

  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Unknown';
  };

  const getVehicleType = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.vehicle_type || 'N/A';
  };

  // Filter trips based on search query and status filter
  const filteredTrips = trips.filter((trip) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      getVehicleName(trip.vehicle_id).toLowerCase().includes(query) ||
      getDriverName(trip.driver_id).toLowerCase().includes(query) ||
      trip.origin.toLowerCase().includes(query) ||
      trip.destination.toLowerCase().includes(query) ||
      trip.status.toLowerCase().includes(query);
    
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'cargo_weight') {
      return b.cargo_weight - a.cargo_weight;
    } else if (sortBy === 'distance') {
      return (b.distance || 0) - (a.distance || 0);
    }
    return 0;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Dispatcher</h1>
          <p className="text-gray-500 mt-1">Manage cargo transport operations</p>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search trips by vehicle, driver, origin, destination, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium block mb-3">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    <SelectItem value="created_at">Most Recent</SelectItem>
                    <SelectItem value="cargo_weight">Cargo Weight</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Trip Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
              <DialogDescription>Enter the details for the new trip</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_id">Select Vehicle</Label>
                  <Select value={formData.vehicle_id} onValueChange={handleVehicleSelect} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose available vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.name} ({vehicle.license_plate}) - {vehicle.max_capacity} kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver_id">Select Driver</Label>
                  <Select value={formData.driver_id} onValueChange={(value) => setFormData({ ...formData, driver_id: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose available driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} ({driver.license_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedVehicle && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Vehicle Capacity: {selectedVehicle.max_capacity} kg</p>
                    <p className="text-blue-700">Ensure cargo weight does not exceed this limit</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g., Warehouse A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g., Customer Location"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cargo_weight">Cargo Weight (kg)</Label>
                  <Input
                    id="cargo_weight"
                    type="number"
                    step="0.01"
                    value={formData.cargo_weight}
                    onChange={(e) => setFormData({ ...formData, cargo_weight: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.01"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="revenue">Estimated Fuel Cost (₹)</Label>
                  <Input
                    id="revenue"
                    type="number"
                    step="0.01"
                    value={formData.revenue}
                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="dispatched">Dispatched</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Trip</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Active Trips ({trips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Cargo Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No trips found. Create your first trip to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium capitalize">{getVehicleType(trip.vehicle_id)}</TableCell>
                      <TableCell>{getDriverName(trip.driver_id)}</TableCell>
                      <TableCell>{trip.origin}</TableCell>
                      <TableCell>{trip.destination}</TableCell>
                      <TableCell>{trip.distance ? `${trip.distance} km` : 'N/A'}</TableCell>
                      <TableCell>{trip.cargo_weight} kg</TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      <TableCell>
                        <Select 
                          value={trip.status} 
                          onValueChange={(value) => handleStatusUpdate(trip.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="dispatched">Dispatched</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
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
