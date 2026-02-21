import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/supabase';
import { getAccessToken } from '../lib/auth';
import { useAuth } from '../lib/useAuth';
import { PermissionGate } from '../components/PermissionGate';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Truck, Search, Archive } from 'lucide-react';

export function VehicleRegistry() {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    license_plate: '',
    max_capacity: '',
    odometer: '',
    status: 'available',
    vehicle_type: 'truck',
    region: 'north',
    acquisition_cost: '',
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${apiUrl}/vehicles`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch vehicles - using empty data');
        setVehicles([]);
        return;
      }

      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
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

    // Validate required fields
    if (!formData.name || !formData.model || !formData.license_plate || 
        !formData.max_capacity || !formData.odometer || !formData.status || 
        !formData.vehicle_type || !formData.region) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const url = editingVehicle
        ? `${apiUrl}/vehicles/${editingVehicle.id}`
        : `${apiUrl}/vehicles`;

      console.log('Submitting vehicle to:', url);
      console.log('Token exists:', !!token);
      console.log('Form data:', formData);

      const response = await fetch(url, {
        method: editingVehicle ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          model: formData.model,
          license_plate: formData.license_plate,
          max_capacity: parseFloat(formData.max_capacity),
          odometer: parseFloat(formData.odometer),
          status: formData.status,
          vehicle_type: formData.vehicle_type,
          region: formData.region,
          acquisition_cost: formData.acquisition_cost ? parseFloat(formData.acquisition_cost) : 0,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        throw new Error(errorData.error || 'Failed to save vehicle');
      }

      toast.success(editingVehicle ? 'Vehicle updated successfully' : 'Vehicle created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      console.error('Error details:', error.message);
      toast.error(error.message || 'Failed to save vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/vehicles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete vehicle');
      }

      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    }
  };

  const handleRetire = async (vehicle) => {
    if (!confirm(`Are you sure you want to retire ${vehicle.name}? This will change its status to Out of Service.`)) {
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...vehicle,
          status: 'out_of_service',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to retire vehicle');
      }

      toast.success('Vehicle retired successfully');
      fetchVehicles();
    } catch (error) {
      console.error('Error retiring vehicle:', error);
      toast.error('Failed to retire vehicle');
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      model: vehicle.model,
      license_plate: vehicle.license_plate,
      max_capacity: vehicle.max_capacity.toString(),
      odometer: vehicle.odometer.toString(),
      status: vehicle.status,
      vehicle_type: vehicle.vehicle_type,
      region: vehicle.region || 'north',
      acquisition_cost: vehicle.acquisition_cost?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      model: '',
      license_plate: '',
      max_capacity: '',
      odometer: '',
      status: 'available',
      vehicle_type: 'truck',
      region: 'north',
      acquisition_cost: '',
    });
    setEditingVehicle(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { label: 'Available', variant: 'default' },
      on_trip: { label: 'On Trip', variant: 'default' },
      in_shop: { label: 'In Shop', variant: 'destructive' },
      out_of_service: { label: 'Out of Service', variant: 'secondary' },
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Filter vehicles based on search query
  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = searchQuery.toLowerCase();
    return (
      vehicle.name.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      vehicle.license_plate.toLowerCase().includes(query) ||
      vehicle.vehicle_type.toLowerCase().includes(query) ||
      vehicle.status.toLowerCase().includes(query) ||
      (vehicle.region && vehicle.region.toLowerCase().includes(query))
    );
  });

  // Apply filters
  const filteredAndSortedVehicles = filteredVehicles
    .filter((vehicle) => {
      if (vehicleTypeFilter !== 'all' && vehicle.vehicle_type !== vehicleTypeFilter) {
        return false;
      }
      if (statusFilter !== 'all' && vehicle.status !== statusFilter) {
        return false;
      }
      if (regionFilter !== 'all' && vehicle.region !== regionFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'model') {
        return a.model.localeCompare(b.model);
      } else if (sortBy === 'license_plate') {
        return a.license_plate.localeCompare(b.license_plate);
      } else if (sortBy === 'vehicle_type') {
        return a.vehicle_type.localeCompare(b.vehicle_type);
      } else if (sortBy === 'max_capacity') {
        return a.max_capacity - b.max_capacity;
      } else if (sortBy === 'odometer') {
        return a.odometer - b.odometer;
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      } else if (sortBy === 'region') {
        return a.region ? a.region.localeCompare(b.region || 'N/A') : -1;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Assets</h1>
          <p className="text-gray-500 mt-1">Comprehensive vehicle management and tracking</p>
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
                placeholder="Search vehicles by name, model, license plate, type, status, or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <label className="text-sm font-medium block mb-3">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on_trip">On Trip</SelectItem>
                    <SelectItem value="in_shop">In Shop</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block mb-3">Region</label>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="north">North</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                    <SelectItem value="east">East</SelectItem>
                    <SelectItem value="west">West</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block mb-3">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="model">Model</SelectItem>
                    <SelectItem value="license_plate">License Plate</SelectItem>
                    <SelectItem value="vehicle_type">Type</SelectItem>
                    <SelectItem value="max_capacity">Capacity</SelectItem>
                    <SelectItem value="odometer">Odometer</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="region">Region</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Vehicle Button */}
      <PermissionGate permission="create_vehicle">
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                <DialogDescription>
                  {editingVehicle ? 'Make changes to your vehicle details' : 'Enter the vehicle details'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Vehicle Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_plate">License Plate (Unique ID)</Label>
                    <Input
                      id="license_plate"
                      value={formData.license_plate}
                      onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">Vehicle Type</Label>
                    <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="bike">Bike</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_capacity">Max Load Capacity (kg)</Label>
                    <Input
                      id="max_capacity"
                      type="number"
                      step="0.01"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odometer">Odometer (km)</Label>
                    <Input
                      id="odometer"
                      type="number"
                      step="0.01"
                      value={formData.odometer}
                      onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="on_trip">On Trip</SelectItem>
                        <SelectItem value="in_shop">In Shop</SelectItem>
                        <SelectItem value="out_of_service">Out of Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="north">North</SelectItem>
                        <SelectItem value="south">South</SelectItem>
                        <SelectItem value="east">East</SelectItem>
                        <SelectItem value="west">West</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acquisition_cost">Acquisition Cost ($)</Label>
                  <Input
                    id="acquisition_cost"
                    type="number"
                    step="0.01"
                    value={formData.acquisition_cost}
                    onChange={(e) => setFormData({ ...formData, acquisition_cost: e.target.value })}
                    placeholder="Optional"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PermissionGate>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Fleet Assets ({filteredAndSortedVehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Max Capacity</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      No vehicles found. Add your first vehicle to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.name}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.license_plate}</TableCell>
                      <TableCell className="capitalize">{vehicle.vehicle_type}</TableCell>
                      <TableCell>{vehicle.max_capacity} kg</TableCell>
                      <TableCell>{vehicle.odometer.toLocaleString()} km</TableCell>
                      <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                      <TableCell className="capitalize">{vehicle.region || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <PermissionGate permission="edit_vehicle">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(vehicle)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="delete_vehicle">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(vehicle.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="edit_vehicle">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetire(vehicle)}
                            >
                              <Archive className="w-4 h-4 text-red-600" />
                            </Button>
                          </PermissionGate>
                        </div>
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