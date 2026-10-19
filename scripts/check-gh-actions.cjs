const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/repos/phummiphat582-debug/scenery-repair-app/actions/runs?per_page=2',
  headers: { 'User-Agent': 'Antigravity-Agent' }
};

https.get(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      data.workflow_runs.forEach(run => {
        console.log(`Run: ${run.name} #${run.run_number} | Status: ${run.status} | Conclusion: ${run.conclusion} | Commit: ${run.head_commit?.message?.slice(0, 60)}`);
      });
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
}).on('error', console.error);
