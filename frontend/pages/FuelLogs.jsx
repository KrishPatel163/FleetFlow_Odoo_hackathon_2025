import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
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
import { Plus, Fuel, Search, X } from 'lucide-react';
import { format } from 'date-fns';

export function FuelLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    trip_id: '',
    driver_id: '',
    vehicle_type: '',
    driver_name: '',
    distance: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, vehiclesRes, tripsRes, driversRes] = await Promise.all([
        fetch(`${apiUrl}/fuel-logs`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
        fetch(`${apiUrl}/vehicles`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
        fetch(`${apiUrl}/trips`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
        fetch(`${apiUrl}/drivers`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
      ]);

      const [logsData, vehiclesData, tripsData, driversData] = await Promise.all([
        logsRes.json(),
        vehiclesRes.json(),
        tripsRes.json(),
        driversRes.json(),
      ]);

      setLogs(logsData.logs || []);
      setVehicles(vehiclesData.vehicles || []);
      setTrips(tripsData.trips || []);
      setDrivers(driversData.drivers || []);
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
      const response = await fetch(`${apiUrl}/fuel-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_id: formData.vehicle_id,
          trip_id: formData.trip_id || undefined,
          liters: 0, // Default value since field is removed
          cost: parseFloat(formData.cost),
          misc_expense: 0, // Default value since field is removed
          date: formData.date,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create fuel log');
      }

      toast.success('Fuel log created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating fuel log:', error);
      toast.error(error.message || 'Failed to create fuel log');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      trip_id: '',
      driver_id: '',
      vehicle_type: '',
      driver_name: '',
      distance: '',
      cost: '',
      date: new Date().toISOString().split('T')[0],
    });
    setSelectedTrip(null);
  };

  const handleTripSelection = (tripId) => {
    if (tripId === 'none') {
      setSelectedTrip(null);
      setFormData({
        ...formData,
        trip_id: '',
        vehicle_id: '',
        driver_id: '',
        vehicle_type: '',
        driver_name: '',
        distance: '',
      });
      return;
    }
    
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      setSelectedTrip(trip);
      const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
      const driver = drivers.find(d => d.id === trip.driver_id);
      
      setFormData({
        ...formData,
        trip_id: tripId,
        vehicle_id: trip.vehicle_id,
        driver_id: trip.driver_id,
        vehicle_type: vehicle?.vehicle_type || '',
        driver_name: driver?.name || '',
        distance: trip.distance?.toString() || '',
      });
    }
  };

  const handleVehicleSelection = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setFormData({
        ...formData,
        vehicle_id: vehicleId,
        vehicle_type: vehicle.vehicle_type,
      });
    }
  };

  const handleDriverSelection = (driverId) => {
    if (driverId === 'none') {
      setFormData({
        ...formData,
        driver_id: '',
        driver_name: '',
      });
      return;
    }
    
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      setFormData({
        ...formData,
        driver_id: driverId,
        driver_name: driver.name,
      });
    }
  };

  const getVehicleInfo = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle || null;
  };

  const getTripInfo = (tripId) => {
    if (!tripId) return null;
    const trip = trips.find(t => t.id === tripId);
    return trip || null;
  };

  const getDriverName = (driverId) => {
    if (!driverId) return 'N/A';
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Unknown';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { label: 'Scheduled', variant: 'secondary' },
      in_progress: { label: 'In Progress', variant: 'default' },
      completed: { label: 'Completed', variant: 'default' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalLiters = logs.reduce((sum, log) => sum + log.liters, 0);
  const totalCost = logs.reduce((sum, log) => sum + log.cost + (log.misc_expense || 0), 0);
  const totalFuelCost = logs.reduce((sum, log) => sum + log.cost, 0);
  const averageCostPerLiter = totalLiters > 0 ? totalFuelCost / totalLiters : 0;

  // Filter and search logs
  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const vehicle = getVehicleInfo(log.vehicle_id);
    const trip = getTripInfo(log.trip_id);
    const driverName = trip ? getDriverName(trip.driver_id) : '';
    
    const matchesSearch = 
      vehicle?.name.toLowerCase().includes(query) ||
      vehicle?.license_plate.toLowerCase().includes(query) ||
      vehicle?.vehicle_type.toLowerCase().includes(query) ||
      driverName.toLowerCase().includes(query) ||
      log.trip_id?.toLowerCase().includes(query) ||
      trip?.status.toLowerCase().includes(query);

    const matchesVehicleType = vehicleTypeFilter === 'all' || vehicle?.vehicle_type === vehicleTypeFilter;
    const matchesStatus = statusFilter === 'all' || trip?.status === statusFilter;

    return matchesSearch && matchesVehicleType && matchesStatus;
  });

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'cost') {
      return b.cost - a.cost;
    } else if (sortBy === 'liters') {
      return b.liters - a.liters;
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fuel & Expense Logs</h1>
        <p className="text-gray-500 mt-1">Track fuel consumption and operational costs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Fuel Consumed</p>
                <p className="text-3xl font-bold mt-2">{totalLiters.toFixed(2)} L</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Fuel className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Fuel Cost</p>
                <p className="text-3xl font-bold mt-2">₹{totalFuelCost.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Cost per Liter</p>
                <p className="text-3xl font-bold mt-2">₹{averageCostPerLiter.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <span className="text-2xl">📊</span>
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
                placeholder="Search by vehicle, driver, trip ID, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium block mb-3">Vehicle Type</label>
                <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block mb-3">Trip Status</label>
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
                    <SelectItem value="cost">Highest Cost</SelectItem>
                    <SelectItem value="liters">Most Liters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Fuel Log Dialog */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Fuel Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Fuel Log</DialogTitle>
              <DialogDescription>
                Add a new fuel log entry to track fuel consumption and expenses.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Trip Selection */}
              <div className="space-y-2">
                <Label>Associated Trip (Optional)</Label>
                <Select value={formData.trip_id} onValueChange={handleTripSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip to auto-fill details" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None - Manual Entry</SelectItem>
                    {trips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        Trip {trip.id.substring(0, 8)} - {trip.origin} → {trip.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTrip && (
                  <p className="text-sm text-green-600">✓ Trip details loaded</p>
                )}
              </div>

              {/* Vehicle & Driver Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle *</Label>
                  <Select 
                    value={formData.vehicle_id} 
                    onValueChange={handleVehicleSelection}
                    required
                    disabled={!!formData.trip_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
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
                  <Label>Vehicle Type</Label>
                  <Input
                    value={formData.vehicle_type}
                    disabled
                    className="capitalize bg-gray-50"
                    placeholder="Auto-filled"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Driver Name</Label>
                  <Input
                    value={formData.driver_name}
                    disabled
                    className="bg-gray-50"
                    placeholder="Auto-filled from trip"
                  />
                </div>
              </div>

              {/* Distance & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Distance (km)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    placeholder="Enter distance"
                    disabled={!!formData.trip_id && !!selectedTrip?.distance}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Fuel Details */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Fuel Expense (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="Enter fuel cost"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Log</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fuel Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Fuel Entries ({sortedLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip ID</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Fuel Expense</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No fuel logs found. Add your first entry to track fuel consumption.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedLogs.map((log) => {
                    const vehicle = getVehicleInfo(log.vehicle_id);
                    const trip = getTripInfo(log.trip_id);
                    const driverName = trip ? getDriverName(trip.driver_id) : 'N/A';
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.trip_id ? log.trip_id.substring(0, 8) : 'N/A'}
                        </TableCell>
                        <TableCell className="capitalize">
                          {vehicle?.vehicle_type || 'N/A'}
                        </TableCell>
                        <TableCell>{driverName}</TableCell>
                        <TableCell>
                          {trip?.distance ? `${trip.distance} km` : 'N/A'}
                        </TableCell>
                        <TableCell>₹{log.cost.toFixed(2)}</TableCell>
                        <TableCell>
                          {trip ? getStatusBadge(trip.status) : <Badge variant="secondary">No Trip</Badge>}
                        </TableCell>
                        <TableCell>{format(new Date(log.date), 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
