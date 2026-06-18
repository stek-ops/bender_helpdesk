const { execFileSync } = require('child_process');

const question = process.argv[2];
if (!question) {
  console.log(JSON.stringify({ error: 'No question' }));
  process.exit(1);
}

try {
  const result = execFileSync('/usr/bin/opencode', [
    'run', '--model', 'opencode/deepseek-v4-flash-free',
    '--dangerously-skip-permissions', '--', question,
  ], {
    cwd: '/tmp',
    timeout: 60000,
    env: {
      HOME: '/tmp',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    },
  });

  const output = result.toString().trim();
  const lines = output.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('>') && !l.startsWith('·'));
  const answer = lines.join('\n') || 'Нічого не зрозумів. Спробуй ще раз.';
  
  console.log(JSON.stringify({ answer, question }));
} catch (e) {
  console.log(JSON.stringify({ error: e.message }));
}
