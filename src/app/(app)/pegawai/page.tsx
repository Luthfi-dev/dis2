'use client';

import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '../../../components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Eye, FilePen, Trash2, Search, FileSearch, Upload, Download, Loader2, ChevronLeft, ChevronRight, AlertCircle, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Pegawai } from '../../../lib/pegawai-data';
import { Badge } from '../../../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "../../../components/ui/dialog"
import React, { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { Input } from '../../../components/ui/input';
import { getPegawai, deletePegawai, importData, ImportResult } from '../../../lib/actions';
import { useToast } from '../../../hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { debounce } from 'lodash';

function ActionMenu({ pegawai, onDelete }: { pegawai: Pegawai, onDelete: (id: string) => void }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  const handleDelete = () => {
    onDelete(pegawai.id);
    setIsAlertOpen(false);
  }

  return (
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Buka menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/pegawai/${pegawai.id}/lihat`}>
              <Eye className="mr-2 h-4 w-4" />
              <span>Lihat</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/pegawai/${pegawai.id}/edit`}>
              <FilePen className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
            <Link href={`/pegawai/${pegawai.id}/preview`}>
              <FileSearch className="mr-2 h-4 w-4" />
              <span>Preview</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsAlertOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Hapus</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat diurungkan. Ini akan menghapus data pegawai <strong>{pegawai.pegawai_nama}</strong> secara permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Hapus</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ImportResultDialog({ result, open, onOpenChange }: { result: ImportResult | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!result) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Hasil Impor Data Pegawai</DialogTitle>
                    <DialogDescription>{result.message}</DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Baris</p>
                            <p className="text-2xl font-bold">{result.totalRows}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Berhasil</p>
                            <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Gagal</p>
                            <p className="text-2xl font-bold text-red-600">{result.failureCount}</p>
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Detail Kegagalan:</h3>
                            <div className="max-h-48 overflow-y-auto rounded-md border p-2 bg-muted/50 text-sm">
                                <ul className="space-y-1">
                                    {result.errors.map((err, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
                                            <span>Baris {err.row}: {err.reason}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button">Tutup</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ImportDialog({ onImportComplete }: { onImportComplete: (result: ImportResult) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, startImportTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const handleImport = async () => {
    if (!file) {
      toast({ title: "File tidak ditemukan", description: "Silakan pilih file Excel untuk diimpor.", variant: "destructive" });
      return;
    }
    startImportTransition(async () => {
        try {
            const fileBase64 = await toBase64(file);
            const result = await importData('pegawai', fileBase64);
            onImportComplete(result);
            setFile(null);
            setIsOpen(false);
        } catch (e) {
            toast({ title: "Gagal", description: "Terjadi kesalahan saat membaca file.", variant: "destructive" });
        }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Impor Data Pegawai</DialogTitle>
          <DialogDescription>
            Pilih file Excel (.xlsx) yang sesuai dengan template untuk mengimpor data pegawai secara massal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
          {file && <p className="text-sm text-muted-foreground">File dipilih: {file.name}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Impor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


const ITEMS_PER_PAGE = 20;

export default function PegawaiPage() {
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const fetchPegawai = useCallback(async (search: string) => {
    setLoading(true);
    const data = await getPegawai(search);
    setPegawaiList(data);
    setCurrentPage(1);
    setLoading(false);
  }, []);

  const debouncedFetchPegawai = useMemo(
    () => debounce((search: string) => fetchPegawai(search), 500),
    [fetchPegawai]
  );

  useEffect(() => {
    debouncedFetchPegawai(searchTerm);
    return () => {
      debouncedFetchPegawai.cancel();
    };
  }, [searchTerm, debouncedFetchPegawai]);

  const handleImportComplete = (result: ImportResult) => {
    setImportResult(result);
    setIsResultOpen(true);
    fetchPegawai(searchTerm); 
  }

  const handleDeletePegawai = (id: string) => {
    startDeleteTransition(async () => {
      const result = await deletePegawai(id);
      if (result.success) {
        setPegawaiList(prev => prev.filter(p => p.id !== id));
        toast({ title: 'Sukses!', description: result.message });
      } else {
        toast({ title: 'Gagal', description: result.message, variant: 'destructive' });
      }
    });
  };

  const totalPages = Math.ceil(pegawaiList.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      return pegawaiList.slice(startIndex, endIndex);
  }, [pegawaiList, currentPage]);

  const handlePageChange = (page: number) => {
      if(page >= 1 && page <= totalPages) {
          setCurrentPage(page);
      }
  }

  const generatePagination = () => {
    if (totalPages <= 1) return [];
    const pages = [];
    const visiblePages = 2;
    pages.push(1);
    if (currentPage > visiblePages + 2) pages.push('...');
    let startPage = Math.max(2, currentPage - visiblePages);
    let endPage = Math.min(totalPages - 1, currentPage + visiblePages);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (currentPage < totalPages - visiblePages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return [...new Set(pages)];
  }

  const paginationItems = generatePagination();

  return (
    <div className="flex flex-col gap-6">
       <ImportResultDialog result={importResult} open={isResultOpen} onOpenChange={setIsResultOpen} />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daftar Pegawai</h1>
          <p className="text-muted-foreground">Kelola data induk pegawai di sini.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-start sm:justify-end">
           <Button variant="outline" asChild>
            <a href="/api/template/pegawai" download="template_pegawai.xlsx">
              <Download className="mr-2 h-4 w-4" />
              Template
            </a>
          </Button>
          <ImportDialog onImportComplete={handleImportComplete} />
          <Button asChild>
            <Link href="/pegawai/tambah">
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Pegawai
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Data Pegawai</CardTitle>
              <CardDescription>Total {pegawaiList.length} pegawai ditemukan.</CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama atau NIP..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="py-4"><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((pegawai) => (
                    <TableRow key={pegawai.id} className={isDeleting ? 'opacity-50' : ''}>
                      <TableCell className="font-medium whitespace-nowrap">{pegawai.pegawai_nama}</TableCell>
                      <TableCell className="whitespace-nowrap">{pegawai.pegawai_nip || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{pegawai.pegawai_jabatan}</TableCell>
                      <TableCell>
                        <Badge variant={pegawai.status === 'Lengkap' ? 'default' : 'outline'} className={pegawai.status === 'Lengkap' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'text-amber-600 border-amber-500/50'}>
                          {pegawai.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionMenu pegawai={pegawai} onDelete={handleDeletePegawai} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Tidak ada data pegawai.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
         {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">
                    Halaman {currentPage} dari {totalPages}
                </span>
                <nav className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    {paginationItems.map((page, index) => (
                        <React.Fragment key={index}>
                            {typeof page === 'number' ? (
                                <Button 
                                    variant={page === currentPage ? "default" : "outline"} 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </Button>
                            ) : (
                                <span className="px-2">...</span>
                            )}
                        </React.Fragment>
                    ))}
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                </nav>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
