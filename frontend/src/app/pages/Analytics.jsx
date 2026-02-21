import { BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export function Analytics() {
    const [analytics, setAnalytics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Unauthorized. Please login again.');
                return;
            }

            const response = await fetch('http://localhost:8000/api/v1/analytics/operational', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to fetch analytics');
            }

            setAnalytics(result.data || []);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ================= SUMMARY CALCULATIONS =================

    const totalRevenue = analytics.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
    const totalOperationalCost = analytics.reduce((sum, item) => sum + Number(item.totalOperationalCost || 0), 0);
    const totalFuelCost = analytics.reduce((sum, item) => sum + Number(item.totalFuelCost || 0), 0);
    const totalProfit = totalRevenue - totalOperationalCost;

    const averageROI =
        analytics.length > 0
            ? analytics.reduce((sum, item) => sum + Number(item.roi || 0), 0) / analytics.length
            : 0;

    const utilizationRate =
        analytics.length > 0
            ? (
                (analytics.reduce((sum, item) => sum + Number(item.completedTrips || 0), 0) /
                    (analytics.reduce((sum, item) => sum + Number(item.totalTrips || 0), 0) || 1)) *
                100
            ).toFixed(0)
            : '0';

    const costliestVehicles = [...analytics]
        .sort((a, b) => Number(b.totalOperationalCost || 0) - Number(a.totalOperationalCost || 0))
        .slice(0, 5)
        .map((item) => ({
            name: item.licensePlate,
            cost: Number(item.totalOperationalCost || 0),
        }));

    const fuelEfficiencyData = analytics.map((item) => ({
        month: item.month || 'N/A',
        efficiency: Number(item.fuelEfficiency || 0),
    }));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Operational Analytics & Reports</h1>
                    <p className="text-gray-500 mt-1">Data-driven insights for fleet management</p>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 border-green-500">
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">Total Fuel Cost</p>
                        <p className="text-4xl font-bold text-green-500">
                            ₹{totalFuelCost.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-green-500">
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">Fleet ROI</p>
                        <p className="text-4xl font-bold text-green-500">
                            {averageROI.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-green-500">
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">Utilization Rate</p>
                        <p className="text-4xl font-bold text-green-500">
                            {utilizationRate}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Fuel Efficiency Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={fuelEfficiencyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="efficiency" stroke="#22c55e" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

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
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="cost" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* TABLE */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Vehicle Performance Metrics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Total Trips</TableHead>
                                <TableHead>Completed</TableHead>
                                <TableHead>Fuel Cost</TableHead>
                                <TableHead>Total Cost</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>ROI</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analytics.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.vehicleName}</TableCell>
                                    <TableCell>{item.totalTrips}</TableCell>
                                    <TableCell>{item.completedTrips}</TableCell>
                                    <TableCell>₹{item.totalFuelCost}</TableCell>
                                    <TableCell>₹{item.totalOperationalCost}</TableCell>
                                    <TableCell>₹{item.revenue}</TableCell>
                                    <TableCell>{item.roi}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}