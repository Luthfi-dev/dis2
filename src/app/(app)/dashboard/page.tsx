'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Users, Briefcase, ArrowRight, History, BookCopy, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../../hooks/use-auth';
import { getSiswa, getPegawai } from '../../../lib/actions';
import { getActivities, Activity } from '../../../lib/activity-log';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAppSettings } from '../../../hooks/use-app-settings';
import { useToast } from '../../../hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';

export default function DashboardPage() {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { toast } = useToast();
  const [siswaCount, setSiswaCount] = useState(0);
  const [pegawaiCount, setPegawaiCount] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
        try {
            const [siswaResult, pegawaiResult] = await Promise.all([
                getSiswa('', 1, 1),
                getPegawai('', 1, 1)
            ]);
            const activitiesData = getActivities();
            
            if (isMounted) {
                setSiswaCount(siswaResult.total);
                setPegawaiCount(pegawaiResult.total);
                setActivities(activitiesData);
            }
        } catch (err: any) {
            console.error("Failed to load dashboard data from server", err);
            if (isMounted) {
                toast({
                    title: "Gagal Memuat Data Dasbor",
                    description: "Terjadi kesalahan saat memuat data.",
                    variant: "destructive"
                });
            }
        }
    }
    fetchData();

    return () => {
        isMounted = false;
    };
  }, [toast]);

  const chartData = [
    { name: 'Siswa', total: siswaCount },
    { name: 'Pegawai', total: pegawaiCount },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Selamat Datang, {user?.name}!</h1>
        <p className="text-muted-foreground">Berikut adalah ringkasan dari aplikasi {settings?.app_title || "EduArchive"} Anda.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siswaCount}</div>
            <p className="text-xs text-muted-foreground">Siswa terdaftar di sistem</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pegawaiCount}</div>
            <p className="text-xs text-muted-foreground">Pegawai terdaftar di sistem</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Perbandingan Data</CardTitle>
            <CardDescription>Visualisasi jumlah data siswa dan pegawai.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  cursor={{ fill: 'hsla(var(--muted))' }}
                  contentStyle={{
                    backgroundColor: 'hsla(var(--background))',
                    borderColor: 'hsla(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Recent Activities and Quick Access */}
        <div className="lg:col-span-3 flex flex-col gap-8">
            {/* Quick Access */}
            <Card className="hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                    <CardTitle>Akses Cepat</CardTitle>
                    <CardDescription>Navigasi cepat ke menu utama.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                     <Link href="/siswa" className="group block rounded-lg border p-4 transition-colors hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <BookCopy className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">Buku Induk Siswa</p>
                                    <p className="text-sm text-muted-foreground">Lihat & Kelola Data Siswa</p>
                                </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                     <Link href="/pegawai" className="group block rounded-lg border p-4 transition-colors hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                 <div className="p-2 rounded-lg bg-primary/10">
                                    <Briefcase className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">Buku Induk Pegawai</p>
                                    <p className="text-sm text-muted-foreground">Lihat & Kelola Data Pegawai</p>
                                </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/> Aktivitas Terbaru</CardTitle>
                 <CardDescription>5 aktivitas terakhir yang tercatat.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.length > 0 ? activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: id })}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-center text-muted-foreground py-4">Belum ada aktivitas.</p>
                  )}
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
