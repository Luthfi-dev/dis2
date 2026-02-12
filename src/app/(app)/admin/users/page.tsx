
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, FilePen, Trash2, Loader2, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { User } from '@/lib/auth';
import { getUsers, saveUser, deleteUser } from '@/lib/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type FormData = Omit<User, 'id'> & { id?: string; password?: string };

export default function UsersPage() {
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({ email: '', name: '', role: 'admin', status: 'active', password: '' });
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const users = await getUsers();
        setUserList(users);
    } catch (err: any) {
        console.error("Failed to fetch users:", err);
        setError(`Gagal memuat data pengguna. Kesalahan: ${err.message}`);
        toast({
          title: "Koneksi Database Gagal",
          description: "Tidak dapat terhubung ke server. Silakan coba lagi nanti.",
          variant: "destructive"
        });
        setUserList([]);
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAdd = () => {
    setSelectedUser(null);
    setFormData({ email: '', name: '', role: 'admin', status: 'active', password: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({ ...user, password: '' });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    const result = await deleteUser(selectedUser.id);
    if (result.success) {
      toast({ title: "Sukses!", description: result.message });
      fetchUsers(); // Refresh list
    } else {
      toast({ title: "Gagal", description: result.message, variant: "destructive" });
    }
    setIsAlertOpen(false);
    setSelectedUser(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) { // Adding new user
      if (!formData.email || !formData.password || !formData.name) {
          toast({ title: "Error!", description: "Email, Nama, dan Password wajib diisi.", variant: "destructive" });
          return;
      }
    }
    
    const payload: FormData = {
        ...formData,
        id: selectedUser?.id
    };
    
    if (!payload.password) {
        delete payload.password; // Don't send empty password
    }

    const result = await saveUser(payload);

    if (result.success) {
      toast({ title: "Sukses!", description: result.message });
      fetchUsers();
    } else {
      toast({ title: "Gagal!", description: result.message, variant: "destructive" });
    }
    
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Pengguna</h1>
          <p className="text-muted-foreground">Tambah, edit, atau hapus data pengguna admin.</p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>Total {userList.length} pengguna admin ditemukan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2 text-destructive">
                            <AlertCircle className="h-8 w-8" />
                            <span className="font-semibold">Terjadi Kesalahan</span>
                            <p className="text-sm">{error}</p>
                        </div>
                    </TableCell>
                </TableRow>
              ) : userList.length > 0 ? (
                userList.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                    <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                            {user.status === 'active' ? 'Aktif' : 'Diblokir'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Buka menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <FilePen className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Hapus</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Tidak ada data pengguna.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{selectedUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
              <DialogDescription>
                {selectedUser ? 'Perbarui data pengguna.' : 'Tambahkan pengguna baru ke dalam sistem.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nama</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="col-span-3" disabled={!!selectedUser} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="col-span-3" placeholder={selectedUser ? 'Kosongkan jika tidak diubah' : ''} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Peran</Label>
                 <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'user' })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih Peran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                 <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'blocked' })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="blocked">Diblokir</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Batal</Button>
              </DialogClose>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat diurungkan. Ini akan menghapus pengguna <strong>{selectedUser?.name}</strong> secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
