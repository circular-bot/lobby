const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Settings Routes
const settingsFilePath = path.join(__dirname, 'settings.json');
const usersFilePath = path.join(__dirname, 'users.json');

app.get('/settings', (req, res) => {
    try {
        if (fs.existsSync(settingsFilePath)) {
            const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
            res.json(settings);
        } else {
            const defaultSettings = {
                Supervisor: [],
                CCC: [],
                Lobby: [],
                TLC: []
            };
            fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings));
            res.json(defaultSettings);
        }
    } catch (error) {
        console.error('Error fetching settings:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.post('/save-settings', (req, res) => {
    try {
        const settings = req.body;
        console.log('Received settings:', settings);
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
        console.log('Settings saved to:', settingsFilePath);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving settings:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// User Management Routes
app.get('/users', (req, res) => {
    try {
        console.log('Fetching users from:', usersFilePath);
        if (fs.existsSync(usersFilePath)) {
            const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
            console.log('Users fetched:', users);
            res.json(users);
        } else {
            console.log('users.json not found, creating with default users');
            const defaultUsers = {
                'cms_user': { password: 'cms123', lobby: 'CMS', criteria: 'Supervisor' },
                'bsp_user': { password: 'bsp123', lobby: 'BSP', criteria: 'CCC' },
                'akt_user': { password: 'akt123', lobby: 'AKT', criteria: 'Lobby' },
                'brjn_user': { password: 'brjn123', lobby: 'BRJN', criteria: 'TLC' },
                'rig_user': { password: 'rig123', lobby: 'RIG', criteria: 'Supervisor' },
                'krba_user': { password: 'krba123', lobby: 'KRBA', criteria: 'CCC' },
                'usl_user': { password: 'usl123', lobby: 'USL', criteria: 'Lobby' },
                'pnd_user': { password: 'pnd123', lobby: 'PND', criteria: 'TLC' },
                'sdl_user': { password: 'sdl123', lobby: 'SDL', criteria: 'Supervisor' },
                'bjri_user': { password: 'bjri123', lobby: 'BJRI', criteria: 'CCC' },
                'sjq_user': { password: 'sjq123', lobby: 'SJQ', criteria: 'Lobby' }
            };
            fs.writeFileSync(usersFilePath, JSON.stringify(defaultUsers, null, 2));
            console.log('Default users saved to:', usersFilePath);
            res.json(defaultUsers);
        }
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.post('/add-user', (req, res) => {
    try {
        const { username, password, lobby, criteria } = req.body;
        if (!username || !password || !lobby || !criteria) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        let users = {};
        if (fs.existsSync(usersFilePath)) {
            users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
        }

        if (users[username]) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        users[username] = { password, lobby, criteria };
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        console.log('New user added:', { username, lobby, criteria });
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding user:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.post('/change-password', (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        if (!username || !currentPassword || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!fs.existsSync(usersFilePath)) {
            return res.status(500).json({ error: 'User database not found' });
        }

        let users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
        if (!users[username]) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (users[username].password !== currentPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        users[username].password = newPassword;
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        console.log('Password changed for user:', username);
        res.json({ success: true });
    } catch (error) {
        console.error('Error changing password:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.post('/delete-user', (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        if (!fs.existsSync(usersFilePath)) {
            return res.status(500).json({ error: 'User database not found' });
        }

        let users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
        if (!users[username]) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (username === 'cms_user') {
            return res.status(403).json({ error: 'Cannot delete admin user (cms_user)' });
        }

        delete users[username];
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        console.log('User deleted:', username);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            console.log('Creating uploads directory');
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage }).single('file');

// Other API Routes
app.post('/upload', (req, res) => {
    console.log('Upload request received');
    upload(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(500).json({ error: 'File upload failed: ' + err.message });
        }

        try {
            const file = req.file;
            if (!file) {
                console.error('No file received');
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const username = req.body.username || 'Unknown';
            const category = req.body.category || 'Uncategorized';
            const dateTime = req.body.dateTime || new Date().toLocaleString();
            const fileURL = `/uploads/${file.filename}`;
            console.log('File uploaded:', file.filename, 'Category:', category);

            const uploadFilePath = path.join(__dirname, 'uploads', 'uploads.json');
            let uploads = [];
            try {
                if (fs.existsSync(uploadFilePath)) {
                    uploads = JSON.parse(fs.readFileSync(uploadFilePath, 'utf8'));
                } else {
                    console.log('Creating new uploads.json');
                    fs.writeFileSync(uploadFilePath, '[]');
                }
            } catch (e) {
                console.error('Error reading uploads.json:', e);
                fs.writeFileSync(uploadFilePath, '[]');
            }

            uploads.unshift({
                fileName: file.originalname,
                uploadedBy: username,
                dateTime: dateTime,
                fileURL: fileURL,
                category: category,
                checkboxes: JSON.parse(req.body.checkboxes || '{}')
            });

            fs.writeFileSync(uploadFilePath, JSON.stringify(uploads));
            console.log('Upload saved to uploads.json with category:', category);
            res.json({ success: true });
        } catch (error) {
            console.error('Upload processing error:', error);
            res.status(500).json({ error: 'Server error: ' + error.message });
        }
    });
});

app.get('/uploads', (req, res) => {
    const uploadFilePath = path.join(__dirname, 'uploads', 'uploads.json');
    try {
        const uploads = JSON.parse(fs.readFileSync(uploadFilePath, 'utf8') || '[]');
        console.log('Returning uploads:', uploads);
        res.json(uploads);
    } catch (error) {
        console.error('Error fetching uploads:', error);
        res.json([]);
    }
});

app.post('/delete', (req, res) => {
    const index = req.body.index;
    const uploadFilePath = path.join(__dirname, 'uploads', 'uploads.json');
    let uploads = JSON.parse(fs.readFileSync(uploadFilePath, 'utf8') || '[]');
    const deletedFile = uploads.splice(index, 1)[0];
    fs.unlink(path.join(__dirname, deletedFile.fileURL), (err) => {
        if (err) console.error('Delete error:', err);
    });
    fs.writeFileSync(uploadFilePath, JSON.stringify(uploads));
    res.json({ success: true });
});

app.post('/update-checkboxes', (req, res) => {
    const { index, location, checked } = req.body;
    const uploadFilePath = path.join(__dirname, 'uploads', 'uploads.json');
    let uploads = JSON.parse(fs.readFileSync(uploadFilePath, 'utf8') || '[]');
    uploads[index].checkboxes[location] = checked;
    fs.writeFileSync(uploadFilePath, JSON.stringify(uploads));
    res.json({ success: true });
});

// Static File Serving
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes for HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/circular.html', (req, res) => res.sendFile(path.join(__dirname, 'circular.html')));
app.get('/database.html', (req, res) => res.sendFile(path.join(__dirname, 'database.html')));
app.get('/settings.html', (req, res) => res.sendFile(path.join(__dirname, 'settings.html')));

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));