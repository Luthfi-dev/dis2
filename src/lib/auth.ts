
'use server';
import 'server-only';
import pool from './db';
import bcrypt from 'bcryptjs';

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'user';
  status: 'active' | 'blocked';
  avatar?: string;
  password?: string;
};

export async function loginAction(email: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const db = await pool.getConnection();
    try {
        const [rows]: any[] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        const user = rows[0];

        if (!user) {
            return { success: false, error: 'Email atau password salah.' };
        }

        if (user.status === 'blocked') {
            return { success: false, error: 'Akun Anda telah diblokir.' };
        }
        
        const isPasswordValid = await bcrypt.compare(pass, user.password);
        if (!isPasswordValid) {
            return { success: false, error: 'Email atau password salah.' };
        }
        
        const sessionUser = { ...user };
        delete sessionUser.password;
        return { success: true, user: sessionUser };

    } catch (error: any) {
        console.error('Login Error:', error);
        return { success: false, error: 'Terjadi kesalahan pada server.' };
    } finally {
        db.release();
    }
}

export async function updateUserAction(updatedUserData: Partial<User> & { id: string }): Promise<{ success: boolean, user?: User, error?: string }> {
    const db = await pool.getConnection();
    try {
        await db.beginTransaction();
        const { id, ...dataToUpdate } = updatedUserData;

        if (dataToUpdate.password && dataToUpdate.password.length > 0) {
            const saltRounds = 10;
            dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, saltRounds);
        } else {
            delete dataToUpdate.password; // Don't update password if it's empty
        }

        if (Object.keys(dataToUpdate).length === 0) {
             const [currentRows]: any[] = await db.query('SELECT id, email, name, role, status, avatar FROM users WHERE id = ?', [id]);
             await db.commit();
             return { success: true, user: currentRows[0] };
        }

        const fields = Object.keys(dataToUpdate).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(dataToUpdate), id];

        await db.query(`UPDATE users SET ${fields} WHERE id = ?`, values);
        
        const [rows]: any[] = await db.query('SELECT id, email, name, role, status, avatar FROM users WHERE id = ?', [id]);
        const updatedUser = rows[0];
        
        await db.commit();
        return { success: true, user: updatedUser };

    } catch (error: any) {
        await db.rollback();
        console.error('Update User Error:', error);
        return { success: false, error: 'Gagal memperbarui pengguna.' };
    } finally {
        db.release();
    }
}

export async function getUsers(): Promise<User[]> {
    const db = await pool.getConnection();
    try {
        const [rows] = await db.query("SELECT id, email, name, role, status, avatar FROM users WHERE role != 'superadmin'");
        return rows as User[];
    } finally {
        db.release();
    }
}

export async function saveUser(user: Partial<User> & { id?: string }): Promise<{ success: boolean; message: string }> {
    const db = await pool.getConnection();
    try {
        await db.beginTransaction();
        const isUpdating = !!user.id;
        
        if (user.password && user.password.length > 0) {
            const saltRounds = 10;
            user.password = await bcrypt.hash(user.password, saltRounds); 
        } else {
            delete user.password;
        }

        if (isUpdating) {
            const { id, ...updateData } = user;
            if (Object.keys(updateData).length === 0) {
                 await db.commit();
                 return { success: true, message: 'Tidak ada perubahan untuk disimpan.' };
            }
            const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updateData);
            await db.query(`UPDATE users SET ${fields} WHERE id = ?`, [...values, id]);
            await db.commit();
            return { success: true, message: 'Pengguna berhasil diperbarui.' };
        } else {
            if (!user.password) {
                await db.rollback();
                return { success: false, message: 'Password wajib diisi untuk pengguna baru.' };
            }
            if(user.id) { // This handles if an ID was passed for a new user, which shouldn't happen with auto-increment
                delete user.id;
            }
            const fields = Object.keys(user);
            const placeholders = fields.map(() => '?').join(', ');
            const values = Object.values(user);
            await db.query(`INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders})`, values);
            await db.commit();
            return { success: true, message: 'Pengguna berhasil ditambahkan.' };
        }
    } catch (error: any) {
        await db.rollback();
        console.error("Error saving user:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return { success: false, message: 'Email sudah terdaftar.' };
        }
        return { success: false, message: `Gagal menyimpan pengguna: ${error.message}` };
    } finally {
        db.release();
    }
}

export async function deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const db = await pool.getConnection();
    try {
        await db.beginTransaction();
        const [result]: any = await db.query('DELETE FROM users WHERE id = ?', [id]);
        await db.commit();
        if (result.affectedRows > 0) {
            return { success: true, message: 'Pengguna berhasil dihapus.' };
        }
        return { success: false, message: 'Pengguna tidak ditemukan.' };
    } catch (error: any) {
        await db.rollback();
        console.error("Error deleting user:", error);
        return { success: false, message: `Gagal menghapus pengguna: ${error.message}` };
    } finally {
        db.release();
    }
}

export async function generateHash(password: string): Promise<{ success: boolean, hash?: string, error?: string }> {
    if (!password) {
        return { success: false, error: 'Password tidak boleh kosong.' };
    }
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        return { success: true, hash };
    } catch(error: any) {
        console.error("Error generating hash:", error);
        return { success: false, error: `Gagal membuat hash: ${error.message}` };
    }
}
