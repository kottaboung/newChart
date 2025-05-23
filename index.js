const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ใช้ node-fetch แบบ dynamic import
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// ให้ Express เสิร์ฟไฟล์จากโฟลเดอร์ public (สำหรับ frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API สำหรับรวมภาษาใน repo ทั้งหมดของผู้ใช้
app.get('/api/languages', async (req, res) => {
  try {
    const username = process.env.GITHUB_USERNAME;
    const token = process.env.GITHUB_TOKEN;

    if (!username || !token) {
      return res.status(500).json({ error: 'Missing GitHub credentials in .env' });
    }

    // ดึง repo ทั้งหมดของผู้ใช้
    const repoResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
      headers: { Authorization: `token ${token}` },
    });

    if (!repoResponse.ok) {
      throw new Error(`Failed to fetch repos: ${repoResponse.statusText}`);
    }

    const repos = await repoResponse.json();
    const totalLangs = {};

    for (const repo of repos) {
      const langResponse = await fetch(repo.languages_url, {
        headers: { Authorization: `token ${token}` },
      });

      if (!langResponse.ok) continue;

      const langData = await langResponse.json();
      for (const [lang, bytes] of Object.entries(langData)) {
        totalLangs[lang] = (totalLangs[lang] || 0) + bytes;
      }
    }

    res.json(totalLangs);
  } catch (error) {
    console.error('Error fetching languages:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
