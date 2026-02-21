import { Archive, Edit, Trash2, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const BASE_URL = "http://localhost:8000/api/v1";

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

    // ================= FETCH VEHICLES =================
    const fetchVehicles = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Session expired. Please login again.");
                return;
            }

            const response = await fetch(`${BASE_URL}/vehicles`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (!response.ok || !result.success)
                throw new Error(result.message);

            setVehicles(result.data.vehicles || []);

        } catch (error) {
            console.error("Fetch vehicles error:", error);
            toast.error(error.message || "Failed to load vehicles");
            setVehicles([]);
        } finally {
            setIsLoading(false);
        }
    };

    // ================= CREATE / UPDATE =================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("You must be logged in");
            return;
        }

        try {
            const url = editingVehicle
                ? `${BASE_URL}/vehicles/${editingVehicle.id}`
                : `${BASE_URL}/vehicles`;

            const response = await fetch(url, {
                method: editingVehicle ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
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
                    acquisition_cost: formData.acquisition_cost
                        ? parseFloat(formData.acquisition_cost)
                        : 0,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success)
                throw new Error(result.message);

            toast.success(result.message);
            setIsDialogOpen(false);
            resetForm();
            fetchVehicles();

        } catch (error) {
            console.error("Save vehicle error:", error);
            toast.error(error.message || "Failed to save vehicle");
        }
    };

    // ================= DELETE =================
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this vehicle?")) return;

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Authentication required");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/vehicles/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (!response.ok || !result.success)
                throw new Error(result.message);

            toast.success(result.message);
            fetchVehicles();

        } catch (error) {
            toast.error(error.message || "Failed to delete vehicle");
        }
    };

    // ================= RETIRE =================
    const handleRetire = async (vehicle) => {
        if (!confirm(`Retire ${vehicle.name}?`)) return;

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Authentication required");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/vehicles/${vehicle.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...vehicle,
                    status: "out_of_service",
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success)
                throw new Error(result.message);

            toast.success(result.message);
            fetchVehicles();

        } catch (error) {
            toast.error(error.message || "Failed to retire vehicle");
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>
                        <Truck className="w-5 h-5 inline mr-2" />
                        Fleet Assets ({vehicles.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Plate</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicles.map(vehicle => (
                                <TableRow key={vehicle.id}>
                                    <TableCell>{vehicle.name}</TableCell>
                                    <TableCell>{vehicle.model}</TableCell>
                                    <TableCell>{vehicle.license_plate}</TableCell>
                                    <TableCell><Badge>{vehicle.status}</Badge></TableCell>
                                    <TableCell>{vehicle.region}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button size="sm" onClick={() => handleEdit(vehicle)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" onClick={() => handleDelete(vehicle.id)}>
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                        <Button size="sm" onClick={() => handleRetire(vehicle)}>
                                            <Archive className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}