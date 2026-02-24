
'use server';
import 'server-only';
import getDB from './db';
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
    const db = await getDB();
    try {
        const [rows]: any[] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        const user = rows[0];

        if (!user) return { success: false, error: 'Email atau password salah.' };
        if (user.status === 'blocked') return { success: false, error: 'Akun diblokir.' };
        
        const isPasswordValid = await bcrypt.compare(pass, user.password);
        if (!isPasswordValid) return { success: false, error: 'Email atau password salah.' };
        
        const sessionUser = { ...user };
        delete sessionUser.password;
        return { success: true, user: sessionUser };
    } catch (error: any) {
        return { success: false, error: 'Kesalahan sistem.' };
    } finally {
        db.release();
    }
}

export async function updateUserAction(updatedUserData: Partial<User> & { id: string }): Promise<{ success: boolean, user?: User, error?: string }> {
    const db = await getDB();
    try {
        const { id, password, ...rest } = updatedUserData;
        let query = 'UPDATE users SET name = ?, email = ?, avatar = ?';
        const params = [rest.name, rest.email, rest.avatar];
        
        if (password) {
            query += ', password = ?';
            params.push(await bcrypt.hash(password, 10));
        }
        query += ' WHERE id = ?';
        params.push(id);

        await db.query(query, params);
        const [rows]: any[] = await db.query('SELECT id, email, name, role, status, avatar FROM users WHERE id = ?', [id]);
        return { success: true, user: rows[0] };
    } finally {
        db.release();
    }
}

export async function getUsers(): Promise<User[]> {
    const db = await getDB();
    try {
        const [rows] = await db.query("SELECT id, email, name, role, status, avatar FROM users WHERE role != 'superadmin'");
        return rows as User[];
    } finally {
        db.release();
    }
}

export async function saveUser(user: Partial<User> & { id?: string }): Promise<{ success: boolean; message: string }> {
    const db = await getDB();
    try {
        const isUpdating = !!user.id;
        if (isUpdating) {
            const { id, password, ...rest } = user;
            await db.query('UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?', [rest.name, rest.email, rest.role, rest.status, id]);
            return { success: true, message: 'Berhasil.' };
        } else {
            const hash = await bcrypt.hash(user.password || '123456', 10);
            await db.query('INSERT INTO users (name, email, role, status, password) VALUES (?, ?, ?, ?, ?)', [user.name, user.email, user.role, user.status, hash]);
            return { success: true, message: 'Berhasil.' };
        }
    } finally {
        db.release();
    }
}

export async function deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const db = await getDB();
    try {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        return { success: true, message: 'Dihapus.' };
    } finally {
        db.release();
    }
}

export async function generateHash(password: string): Promise<{ success: boolean, hash?: string, error?: string }> {
    try {
        const hash = await bcrypt.hash(password, 10);
        return { success: true, hash };
    } catch(e: any) { return { success: false, error: e.message }; }
}
