import { NextRequest, NextResponse } from 'next/server';
import Excel from 'exceljs';

const siswaHeaders = [
    { header: 'Nama Lengkap (Wajib)', key: 'siswa_namaLengkap', width: 30 },
    { header: 'NIS (Wajib)', key: 'siswa_nis', width: 15 },
    { header: 'NISN (Wajib)', key: 'siswa_nisn', width: 15 },
    { header: 'Jenis Kelamin', key: 'siswa_jenisKelamin', width: 15 },
    { header: 'Tempat Lahir', key: 'siswa_tempatLahir', width: 20 },
    { header: 'Tanggal Lahir (YYYY-MM-DD)', key: 'siswa_tanggalLahir', width: 20 },
    { header: 'Agama', key: 'siswa_agama', width: 15 },
    { header: 'Kewarganegaraan', key: 'siswa_kewarganegaraan', width: 15 },
    { header: 'Nomor HP/WA', key: 'siswa_telepon', width: 20 },
    { header: 'Nama Ayah', key: 'siswa_namaAyah', width: 30 },
    { header: 'Nama Ibu', key: 'siswa_namaIbu', width: 30 },
    { header: 'Pekerjaan Ayah', key: 'siswa_pekerjaanAyah', width: 20 },
    { header: 'Pekerjaan Ibu', key: 'siswa_pekerjaanIbu', width: 20 },
];

const siswaDummy = {
    siswa_namaLengkap: 'Budi Santoso (Contoh)',
    siswa_nis: '12345',
    siswa_nisn: '0012345678',
    siswa_jenisKelamin: 'Laki-laki',
    siswa_tempatLahir: 'Jakarta',
    siswa_tanggalLahir: '2010-05-15',
    siswa_agama: 'Islam',
    siswa_kewarganegaraan: 'WNI',
    siswa_telepon: '081234567890',
    siswa_namaAyah: 'Ahmad Santoso',
    siswa_namaIbu: 'Siti Aminah',
    siswa_pekerjaanAyah: 'Wiraswasta',
    siswa_pekerjaanIbu: 'Ibu Rumah Tangga',
};

const pegawaiHeaders = [
    { header: 'Nama Lengkap (Wajib)', key: 'pegawai_nama', width: 30 },
    { header: 'NIP (Wajib)', key: 'pegawai_nip', width: 25 },
    { header: 'Jenis Kelamin', key: 'pegawai_jenisKelamin', width: 15 },
    { header: 'Tempat Lahir', key: 'pegawai_tempatLahir', width: 20 },
    { header: 'Tanggal Lahir (YYYY-MM-DD)', key: 'pegawai_tanggalLahir', width: 20 },
    { header: 'Jabatan', key: 'pegawai_jabatan', width: 25 },
    { header: 'Status Perkawinan', key: 'pegawai_statusPerkawinan', width: 20 },
    { header: 'NUPTK', key: 'pegawai_nuptk', width: 20 },
    { header: 'NRG', key: 'pegawai_nrg', width: 20 },
    { header: 'Bidang Studi', key: 'pegawai_bidangStudi', width: 20 },
];

const pegawaiDummy = {
    pegawai_nama: 'Dr. Anisa Rahmawati, S.Pd. (Contoh)',
    pegawai_nip: '198501012010122001',
    pegawai_jenisKelamin: 'Perempuan',
    pegawai_tempatLahir: 'Bandung',
    pegawai_tanggalLahir: '1985-01-01',
    pegawai_jabatan: 'Guru Mata Pelajaran',
    pegawai_statusPerkawinan: 'Kawin',
    pegawai_nuptk: '1234567890123456',
    pegawai_nrg: '0987654321',
    pegawai_bidangStudi: 'Bahasa Indonesia',
};


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    const { type } = await params;

    let headers, dummyData, fileName;

    if (type === 'siswa') {
        headers = siswaHeaders;
        dummyData = siswaDummy;
        fileName = 'template_siswa.xlsx';
    } else if (type === 'pegawai') {
        headers = pegawaiHeaders;
        dummyData = pegawaiDummy;
        fileName = 'template_pegawai.xlsx';
    } else {
        return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
    }

    try {
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Data');

        worksheet.columns = headers;
        
        // Style header
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF3F51B5' }, // Blue color from theme
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        worksheet.addRow(dummyData);

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Create response
        const response = new NextResponse(buffer);
        response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.headers.set('Content-Disposition', `attachment; filename=${fileName}`);

        return response;

    } catch (error) {
        console.error('Failed to generate Excel template:', error);
        return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
    }
}