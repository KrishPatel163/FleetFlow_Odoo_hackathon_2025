import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export function Dashboard() {
  const navigate = useNavigate();

  const [kpis, setKpis] = useState({
    activeFleet: 0,
    maintenanceAlerts: 0,
    utilizationRate: 0,
    pendingCargo: 0,
    totalVehicles: 0,
    assignedVehicles: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [trips, setTrips] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
    fetchTripsData();
  }, []);

  // ================= FETCH DASHBOARD =================
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Session expired. Please login again.');
        navigate('/');
        return;
      }

      const response = await fetch(
        'http://localhost:8000/api/v1/analytics/dashboard',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch dashboard');
      }

      setKpis(result.data);

    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= FETCH TRIPS =================
  const fetchTripsData = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:8000/api/v1/trips',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch trips');
      }

      setTrips(result.data || []);

    } catch (error) {
      console.error('Trips error:', error);
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const availableVehicles =
    kpis.totalVehicles - kpis.assignedVehicles - kpis.maintenanceAlerts;

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
        <p className="text-gray-500 mt-1">High-level fleet oversight at a glance</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Active Fleet</p>
            <p className="text-3xl font-bold">{kpis.activeFleet}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Maintenance Alerts</p>
            <p className="text-3xl font-bold">{kpis.maintenanceAlerts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Utilization Rate</p>
            <p className="text-3xl font-bold">{kpis.utilizationRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Pending Cargo</p>
            <p className="text-3xl font-bold">{kpis.pendingCargo}</p>
          </CardContent>
        </Card>
      </div>

      {/* FLEET OVERVIEW */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p>Total Vehicles</p>
            <p className="text-2xl font-bold">{kpis.totalVehicles}</p>
          </div>
          <div className="text-center">
            <p>Available</p>
            <p className="text-2xl font-bold">{availableVehicles}</p>
          </div>
          <div className="text-center">
            <p>On Trip</p>
            <p className="text-2xl font-bold">{kpis.activeFleet}</p>
          </div>
          <div className="text-center">
            <p>In Maintenance</p>
            <p className="text-2xl font-bold">{kpis.maintenanceAlerts}</p>
          </div>
        </CardContent>
      </Card>

      {/* RECENT TRIPS */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip ID</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No trips found
                  </TableCell>
                </TableRow>
              ) : (
                trips.slice(0, 10).map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>{trip.id}</TableCell>
                    <TableCell>{trip.vehicleName || 'N/A'}</TableCell>
                    <TableCell>{trip.driverName || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge>{trip.status}</Badge>
                    </TableCell>
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