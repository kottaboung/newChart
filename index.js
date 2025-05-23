const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(express.static('public'));

app.get('/api/languages', async (req, res) => {
  try {
    const username = process.env.GITHUB_USERNAME;
    const token = process.env.GITHUB_TOKEN;
    
    // ดึง repo
    const repoResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
      headers: { Authorization: `token ${token}` },
    });
    const repos = await repoResponse.json();

    let totalLangs = {};

    for (const repo of repos) {
      const langResponse = await fetch(repo.languages_url, {
        headers: { Authorization: `token ${token}` },
      });
      const langData = await langResponse.json();

      for (const [lang, bytes] of Object.entries(langData)) {
        totalLangs[lang] = (totalLangs[lang] || 0) + bytes;
      }
    }

    res.json(totalLangs);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
