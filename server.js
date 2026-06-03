const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Saytdan göndərilən məlumatları (JSON) oxuya bilmək üçün
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik faylları aktiv etmək
app.use(express.static(path.join(__dirname, '.')));

// Qeydiyyatdan keçənlərin siyahısını yadda saxlayan müvəqqəti baza
let registeredUsers = [];

// Şifrə panelini idarə etmək üçün gizli şifrə
const ADMIN_PASSWORD = "Nihad2505";

// 1. Müştəri qeydiyyatdan keçəndə məlumatları qəbul edən mexanizm
app.post('/api/register', (req, res) => {
    // [YENİLƏNDİ] product (məhsul) məlumatını da qəbul edirik
    const { name, email, cardName, cardNumber, product } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ success: false, message: "Məlumatlar əskikdir!" });
    }

    // Kart nömrəsinin son 4 rəqəmini saxlayıb qalanını gizlədirik
    const secureCard = cardNumber ? `**** **** **** ${cardNumber.slice(-4)}` : "Kart daxil edilməyib";

    // İstifadəçini siyahıya əlavə edirik
    registeredUsers.push({
        id: registeredUsers.length + 1,
        name: name,
        email: email,
        cardName: cardName || "-",
        card: secureCard,
        product: product || "Bilinməyən Məhsul", // [YENİ] Müştərinin seçdiyi məhsul
        date: new Date().toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })
    });

    res.json({ success: true, message: "Qeydiyyat uğurlu!" });
});

// 2. Şifrəni təhlükəsiz yoxlamaq və canlı datanı göndərmək üçün API
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        // Şifrə düzdürsə, canlı olaraq qeydiyyatdan keçən hər kəsi göndər
        return res.json({ success: true, users: registeredUsers });
    }
    res.status(401).json({ success: false, message: "Yanlış şifrə!" });
});

// 3. Admin Panelinin vizual görüntüsü (HTML/JS)
app.get('/admin', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="az">
    <head>
        <meta charset="UTF-8">
        <title>NKSHOP — Admin Panel</title>
        <style>
            body { font-family: sans-serif; background: #f4f6f9; padding: 40px; color: #333; }
            .container { max-width: 1100px; margin: 0 auto; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            h2 { color: #1a1a2e; border-bottom: 2px solid #e94560; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #1a1a2e; color: white; }
            tr:hover { background-color: #f9f9f9; }
            .login-box { max-width: 400px; margin: 100px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; }
            input { width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
            button { background: #e94560; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; }
            .badge { background: #1a1a2e; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold; }
        </style>
    </head>
    <body>
        <div id="authBlock" class="login-box">
            <h3>Admin Girişi</h3>
            <input type="password" id="passInput" placeholder="Şifrəni daxil edin">
            <button onclick="checkPass()">Daxil Ol</button>
        </div>

        <div id="adminContent" class="container" style="display:none;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>NKSHOP — Müştəri Qeydiyyat Siyahısı</h2>
                <button onclick="logout()" style="width: auto; background: #333; padding: 8px 15px;">Çıxış Et</button>
            </div>
            <p>Ümumi müştəri sayı: <b id="totalUsersCount">0</b></p>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ad, Soyad</th>
                        <th>Məhsul</th>
                        <th>E-poçt Ünvanı</th>
                        <th>Kart Sahibi</th>
                        <th>Gizli Kart №</th>
                        <th>Qeydiyyat Tarixi</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                </tbody>
            </table>
        </div>

        <script>
            // Səhifə yüklənəndə avtomatik yoxla
            window.onload = function() {
                const savedPass = sessionStorage.getItem('admin_password');
                if (savedPass) {
                    document.getElementById('passInput').value = savedPass;
                    checkPass(savedPass);
                }
            }

            function checkPass(customPass) {
                const pass = customPass || document.getElementById('passInput').value;
                
                fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: pass })
                })
                .then(res => {
                    if(!res.ok) {
                        sessionStorage.removeItem('admin_password'); // Səhvdirsə yaddaşdan sil
                        throw new Error('Səhv şifrə!');
                    }
                    return res.json();
                })
                .then(data => {
                    // Şifrə düzdürsə brauzer yaddaşına yazırıq (Səhifə yenilənəndə itməməsi üçün)
                    sessionStorage.setItem('admin_password', pass);

                    document.getElementById('authBlock').style.display = 'none';
                    document.getElementById('adminContent').style.display = 'block';
                    
                    document.getElementById('totalUsersCount').innerText = data.users.length;
                    
                    const tbody = document.getElementById('tableBody');
                    tbody.innerHTML = '';
                    
                    if(data.users.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888;">Hələ qeydiyyatdan keçən yoxdur.</td></tr>';
                        return;
                    }

                    data.users.forEach(u => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = \`
                            <td>\${u.id}</td>
                            <td><b>\${u.name}</b></td>
                            <td><span class="badge">\${u.product}</span></td>
                            <td>\${u.email}</td>
                            <td>\${u.cardName}</td>
                            <td style="color:#e94560; font-weight:bold;">\${u.card}</td>
                            <td><small>\${u.date}</small></td>
                        \`;
                        tbody.appendChild(tr);
                    });
                })
                .catch(err => alert(err.message));
            }

            function logout() {
                sessionStorage.removeItem('admin_password');
                window.location.reload();
            }
        </script>
    </body>
    </html>
    `);
});

// Əsas səhifə olaraq index.html-i açır
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serverimiz ${PORT} portunda uğurla start götürdü...`);
});
