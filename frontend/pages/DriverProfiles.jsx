import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/supabase';
import { getAccessToken } from '../lib/auth';
import { apiRequest, handleApiError } from '../lib/apiHelper';
import { publicAnonKey } from '/utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { Plus, Users, Edit, Trash2, AlertCircle, Search } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { useAuth } from '../lib/useAuth';

export function DriverProfiles() {
  const { hasPermission } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  
  // Search and filter states
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

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();

      if (!token) {
        console.error('No access token available');
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`${apiUrl}/drivers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Check if it's a network/connection error
        if (response.status === 0 || !response.status) {
          console.warn('Backend not connected - using empty data');
          setDrivers([]);
          return;
        }
        throw new Error('Failed to fetch drivers');
      }

      const data = await response.json();
      setDrivers(data.drivers || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // Check if it's a network error (backend not available)
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        console.warn('Backend not available - using empty data');
        setDrivers([]);
      } else {
        toast.error('Failed to load drivers');
      }
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
    if (!formData.name || !formData.license_number || !formData.license_expiry || 
        !formData.status || !formData.safety_score) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const url = editingDriver
        ? `${apiUrl}/drivers/${editingDriver.id}`
        : `${apiUrl}/drivers`;

      console.log('Submitting driver to:', url);
      console.log('Token exists:', !!token);
      console.log('Form data:', formData);

      const response = await fetch(url, {
        method: editingDriver ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          license_number: formData.license_number,
          license_expiry: formData.license_expiry,
          status: formData.status,
          safety_score: parseFloat(formData.safety_score),
          phone: formData.phone,
          email: formData.email,
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
        throw new Error(errorData.error || 'Failed to save driver');
      }

      toast.success(editingDriver ? 'Driver updated successfully' : 'Driver created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error('Error saving driver:', error);
      console.error('Error details:', error.message);
      toast.error(error.message || 'Failed to save driver');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this driver?')) {
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/drivers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete driver');
      }

      toast.success('Driver deleted successfully');
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Failed to delete driver');
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      on_duty: { label: 'On Duty', variant: 'default' },
      off_duty: { label: 'Off Duty', variant: 'secondary' },
      suspended: { label: 'Suspended', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isLicenseExpired = (expiryDate) => {
    return isBefore(new Date(expiryDate), new Date());
  };

  const getCompletionRate = (driver) => {
    if (driver.total_trips === 0) return 0;
    return ((driver.completed_trips / driver.total_trips) * 100).toFixed(1);
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const activeDrivers = drivers.filter(d => d.status === 'on_duty').length;
  const expiredLicenses = drivers.filter(d => isLicenseExpired(d.license_expiry)).length;
  const averageSafetyScore = drivers.length > 0
    ? (drivers.reduce((sum, d) => sum + d.safety_score, 0) / drivers.length).toFixed(1)
    : '0';

  // Filter and search drivers
  const filteredDrivers = drivers.filter((driver) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      driver.name.toLowerCase().includes(query) ||
      driver.license_number.toLowerCase().includes(query) ||
      driver.phone?.toLowerCase().includes(query) ||
      driver.email?.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    const matchesLicense = licenseFilter === 'all' || 
      (licenseFilter === 'expired' && isLicenseExpired(driver.license_expiry)) ||
      (licenseFilter === 'valid' && !isLicenseExpired(driver.license_expiry));

    return matchesSearch && matchesStatus && matchesLicense;
  });

  // Sort drivers
  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'safety_score') {
      return b.safety_score - a.safety_score;
    } else if (sortBy === 'total_trips') {
      return b.total_trips - a.total_trips;
    } else if (sortBy === 'license_expiry') {
      return new Date(a.license_expiry).getTime() - new Date(b.license_expiry).getTime();
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
          <h1 className="text-3xl font-bold text-gray-900">Driver Profiles</h1>
          <p className="text-gray-500 mt-1">Human resource and compliance management</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-3xl font-bold mt-2">{drivers.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Duty</p>
                <p className="text-3xl font-bold mt-2">{activeDrivers}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired Licenses</p>
                <p className="text-3xl font-bold mt-2">{expiredLicenses}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Safety Score</p>
                <p className="text-3xl font-bold mt-2">{averageSafetyScore}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <span className="text-2xl">🛡️</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        {/* Search Bar and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, license number, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium block mb-3">Driver Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="on_duty">On Duty</SelectItem>
                      <SelectItem value="off_duty">Off Duty</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium block mb-3">License Status</label>
                  <Select value={licenseFilter} onValueChange={setLicenseFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Licenses</SelectItem>
                      <SelectItem value="valid">Valid</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
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
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="safety_score">Highest Safety Score</SelectItem>
                      <SelectItem value="total_trips">Most Trips</SelectItem>
                      <SelectItem value="license_expiry">License Expiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Driver Button */}
        {hasPermission('create_driver') && (
          <div className="flex justify-end">
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            </DialogTrigger>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Driver Roster ({sortedDrivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>License #</TableHead>
                    <TableHead>License Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Safety Score</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Total Trips</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No drivers found. Add your first driver to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedDrivers.map((driver) => {
                      const expired = isLicenseExpired(driver.license_expiry);
                      const completionRate = getCompletionRate(driver);
                      
                      return (
                        <TableRow key={driver.id}>
                          <TableCell className="font-medium">{driver.name}</TableCell>
                          <TableCell>{driver.license_number}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {format(new Date(driver.license_expiry), 'MMM dd, yyyy')}
                              {expired && (
                                <Badge variant="destructive" className="text-xs">Expired</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(driver.status)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className={`font-semibold ${getSafetyScoreColor(driver.safety_score)}`}>
                                {driver.safety_score}
                              </div>
                              <Progress value={driver.safety_score} className="h-1.5" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-semibold">{completionRate}%</div>
                              <Progress value={parseFloat(completionRate)} className="h-1.5" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{driver.completed_trips} / {driver.total_trips}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {hasPermission('edit_driver') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(driver)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              {hasPermission('delete_driver') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(driver.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
            <DialogDescription>
              {editingDriver ? 'Edit the driver details below.' : 'Enter the driver details below.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_expiry">License Expiry Date</Label>
                <Input
                  id="license_expiry"
                  type="date"
                  value={formData.license_expiry}
                  onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    <SelectItem value="on_duty">On Duty</SelectItem>
                    <SelectItem value="off_duty">Off Duty</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="safety_score">Safety Score (0-100)</Label>
                <Input
                  id="safety_score"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.safety_score}
                  onChange={(e) => setFormData({ ...formData, safety_score: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDriver ? 'Update Driver' : 'Add Driver'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}