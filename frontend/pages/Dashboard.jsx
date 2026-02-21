import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { apiUrl } from '../lib/supabase';
import { getAccessToken } from '../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Truck, Wrench, TrendingUp, Package, Activity, Search, Plus } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState({
    activeFleet: 0,
    maintenanceAlerts: 0,
    utilizationRate: '0',
    pendingCargo: 0,
    totalVehicles: 0,
    assignedVehicles: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchTripsData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${apiUrl}/analytics/dashboard`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch dashboard data - using empty data');
        return;
      }

      const data = await response.json();
      setKpis(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTripsData = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${apiUrl}/trips?select=*,vehicles(name,license_plate),drivers(name)`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch trips data - using empty data');
        return;
      }

      const data = await response.json();
      setTrips(data.trips || []);
    } catch (error) {
      console.error('Error fetching trips data:', error);
    }
  };

  const kpiCards = [
    {
      title: 'Active Fleet',
      value: kpis.activeFleet,
      subtitle: 'Vehicles on trip',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Maintenance Alerts',
      value: kpis.maintenanceAlerts,
      subtitle: 'Vehicles in shop',
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Utilization Rate',
      value: `${kpis.utilizationRate}%`,
      subtitle: `${kpis.assignedVehicles} of ${kpis.totalVehicles} assigned`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending Cargo',
      value: kpis.pendingCargo,
      subtitle: 'Awaiting assignment',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

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
        <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
        <p className="text-gray-500 mt-1">High-level fleet oversight at a glance</p>
      </div>

      {/* Combined Search Bar and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search vehicles, trips, drivers..."
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
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                    <SelectItem value="utilization">Utilization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-3xl font-bold mt-2">{kpi.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{kpi.subtitle}</p>
                </div>
                <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Metrics & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-sm">Fleet Utilization</span>
                  <span className="font-semibold text-lg">{kpis.utilizationRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${kpis.utilizationRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-sm">Assigned Vehicles</span>
                  <span className="font-semibold text-lg">{kpis.assignedVehicles}/{kpis.totalVehicles}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${(kpis.assignedVehicles / kpis.totalVehicles) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              onClick={() => navigate('/app/trips')}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Trip
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/app/vehicles')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Fleet Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-1">Total Vehicles</p>
              <p className="font-semibold text-2xl">{kpis.totalVehicles}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-1">Available</p>
              <p className="font-semibold text-2xl text-green-600">
                {kpis.totalVehicles - kpis.assignedVehicles - kpis.maintenanceAlerts}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-1">On Trip</p>
              <p className="font-semibold text-2xl text-blue-600">{kpis.activeFleet}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-1">In Maintenance</p>
              <p className="font-semibold text-2xl text-orange-600">{kpis.maintenanceAlerts}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Trips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Trips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No trips found
                    </TableCell>
                  </TableRow>
                ) : (
                  trips.slice(0, 10).map((trip, index) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{trip.vehicle?.name || 'N/A'}</TableCell>
                      <TableCell>{trip.driver?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            trip.status === 'in_progress' || trip.status === 'on_trip'
                              ? 'default'
                              : trip.status === 'completed'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {trip.status === 'in_progress' || trip.status === 'on_trip'
                            ? 'On Trip'
                            : trip.status === 'completed'
                            ? 'Completed'
                            : trip.status === 'pending'
                            ? 'Pending'
                            : trip.status}
                        </Badge>
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