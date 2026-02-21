import { isBefore } from 'date-fns';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuth } from '../lib/useAuth';

const BASE_URL = "http://localhost:8000/api/v1";

export function DriverProfiles() {
  const { hasPermission } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [licenseFilter, setLicenseFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    license_expiry: '',
    status: 'off_duty',
    safety_score: '100',
    phone: '',
    email: '',
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  // ================= FETCH DRIVERS =================
  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Session expired. Please login again.");
        return;
      }

      const response = await fetch(`${BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch drivers");
      }

      setDrivers(result.data.drivers || []);

    } catch (error) {
      console.error("Fetch drivers error:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= CREATE / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      const url = editingDriver
        ? `${BASE_URL}/drivers/${editingDriver.id}`
        : `${BASE_URL}/drivers`;

      const response = await fetch(url, {
        method: editingDriver ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          safety_score: parseFloat(formData.safety_score),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save driver");
      }

      toast.success(result.message);

      setIsDialogOpen(false);
      resetForm();
      fetchDrivers();

    } catch (error) {
      console.error("Save driver error:", error);
      toast.error(error.message);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/drivers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete driver");
      }

      toast.success(result.message);
      fetchDrivers();

    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message);
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      license_number: driver.license_number,
      license_expiry: driver.license_expiry,
      status: driver.status,
      safety_score: driver.safety_score.toString(),
      phone: driver.phone || '',
      email: driver.email || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      license_number: '',
      license_expiry: '',
      status: 'off_duty',
      safety_score: '100',
      phone: '',
      email: '',
    });
    setEditingDriver(null);
  };

  const isLicenseExpired = (date) => {
    return isBefore(new Date(date), new Date());
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Driver Profiles</h1>
        <p className="text-gray-500 mt-1">Human resource and compliance management</p>
      </div>

      {hasPermission("create_driver") && (
        <div className="flex justify-end">
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Driver Roster ({drivers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>License #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Safety Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No drivers found
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>{driver.name}</TableCell>
                    <TableCell>{driver.license_number}</TableCell>
                    <TableCell>
                      <Badge>{driver.status}</Badge>
                    </TableCell>
                    <TableCell>{driver.safety_score}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(driver)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(driver.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
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