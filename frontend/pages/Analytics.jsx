import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/supabase';
import { publicAnonKey } from '/utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { BarChart3, Download, TrendingUp, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Analytics() {
  const [analytics, setAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${apiUrl}/analytics/operational`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (analytics.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create CSV headers
    const headers = [
      'Vehicle',
      'License Plate',
      'Total Trips',
      'Completed Trips',
      'Fuel Cost ($)',
      'Maintenance Cost ($)',
      'Total Operational Cost ($)',
      'Fuel Efficiency (km/L)',
      'ROI (%)',
      'Revenue ($)',
    ];

    // Create CSV rows
    const rows = analytics.map(item => [
      item.vehicle_name,
      item.license_plate,
      item.total_trips,
      item.completed_trips,
      item.total_fuel_cost,
      item.total_maintenance_cost,
      item.total_operational_cost,
      item.fuel_efficiency,
      item.roi,
      item.revenue,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fleet_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Analytics exported to CSV');
  };

  const exportToPDF = () => {
    toast.info('PDF export functionality would require a PDF library. CSV export is available.');
  };

  // Calculate summary metrics
  const totalRevenue = analytics.reduce((sum, item) => sum + parseFloat(item.revenue), 0);
  const totalOperationalCost = analytics.reduce((sum, item) => sum + parseFloat(item.total_operational_cost), 0);
  const totalProfit = totalRevenue - totalOperationalCost;
  const totalFuelCost = analytics.reduce((sum, item) => sum + parseFloat(item.total_fuel_cost), 0);
  const averageROI = analytics.length > 0
    ? analytics
        .filter(item => item.roi !== 'N/A')
        .reduce((sum, item) => sum + parseFloat(item.roi), 0) / analytics.filter(item => item.roi !== 'N/A').length
    : 0;

  // Prepare data for Fuel Efficiency Trend chart (mock monthly data)
  const fuelEfficiencyData = [
    { month: 'Jan', efficiency: 12.5 },
    { month: 'Feb', efficiency: 13.2 },
    { month: 'Mar', efficiency: 11.8 },
    { month: 'Apr', efficiency: 14.5 },
    { month: 'May', efficiency: 13.9 },
    { month: 'Jun', efficiency: 15.2 },
  ];

  // Prepare data for Top 5 Costliest Vehicles
  const costliestVehicles = [...analytics]
    .sort((a, b) => parseFloat(b.total_operational_cost) - parseFloat(a.total_operational_cost))
    .slice(0, 5)
    .map(item => ({
      name: item.license_plate,
      cost: parseFloat(item.total_operational_cost),
    }));

  // Calculate fleet utilization rate (mock calculation)
  const utilizationRate = analytics.length > 0 
    ? ((analytics.reduce((sum, item) => sum + item.completed_trips, 0) / 
        (analytics.reduce((sum, item) => sum + item.total_trips, 0) || 1)) * 100).toFixed(0)
    : '0';

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
          <h1 className="text-3xl font-bold text-gray-900">Operational Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Data-driven insights for fleet management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-green-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Fuel Cost</p>
              <p className="text-4xl font-bold text-green-500">
                Rs. {(totalFuelCost / 1000).toFixed(1)} L
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Fleet ROI</p>
              <p className="text-4xl font-bold text-green-500">
                {averageROI >= 0 ? '+' : ''}{averageROI.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Utilization Rate</p>
              <p className="text-4xl font-bold text-green-500">
                {utilizationRate}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fuel Efficiency Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Efficiency Trend (km/L)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fuelEfficiencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Efficiency (km/L)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 Costliest Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Costliest Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costliestVehicles}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="cost" fill="#8b5cf6" name="Cost (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Card */}
      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="text-blue-500">Financial Summary of Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold mt-2 text-green-600">
                ₹{totalRevenue.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Operational Cost</p>
              <p className="text-2xl font-bold mt-2 text-red-600">
                ₹{totalOperationalCost.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold mt-2 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{totalProfit.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Average ROI</p>
              <p className="text-2xl font-bold mt-2 text-purple-600">
                {averageROI.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Vehicle Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Total Trips</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Fuel Cost</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead>Total Op. Cost</TableHead>
                  <TableHead>Efficiency (km/L)</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>ROI (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                      No analytics data available. Start tracking trips, fuel, and maintenance to see insights.
                    </TableCell>
                  </TableRow>
                ) : (
                  analytics.map((item) => (
                    <TableRow key={item.vehicle_id}>
                      <TableCell className="font-medium">{item.vehicle_name}</TableCell>
                      <TableCell>{item.license_plate}</TableCell>
                      <TableCell>{item.total_trips}</TableCell>
                      <TableCell>{item.completed_trips}</TableCell>
                      <TableCell>₹{item.total_fuel_cost}</TableCell>
                      <TableCell>₹{item.total_maintenance_cost}</TableCell>
                      <TableCell className="font-semibold">₹{item.total_operational_cost}</TableCell>
                      <TableCell>{item.fuel_efficiency}</TableCell>
                      <TableCell className="text-green-600 font-semibold">₹{item.revenue}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          item.roi !== 'N/A' && parseFloat(item.roi) > 0 
                            ? 'text-green-600' 
                            : item.roi !== 'N/A' 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                        }`}>
                          {item.roi !== 'N/A' ? `${item.roi}%` : item.roi}
                        </span>
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
