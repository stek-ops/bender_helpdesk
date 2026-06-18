<?php
/**
 * AI wrapper - calls opencode to answer helpdesk questions
 * Usage: php ask.php "user question"
 */

$question = $argv[1] ?? '';
if (empty($question)) {
    echo json_encode(['error' => 'No question provided']);
    exit(1);
}

$descriptorspec = [
    0 => ['pipe', 'r'],  // stdin
    1 => ['pipe', 'w'],  // stdout
    2 => ['pipe', 'w'],  // stderr
];

$process = proc_open(
    'opencode run --model opencode/deepseek-v4-flash-free --dangerously-skip-permissions ' . escapeshellarg($question) . ' 2>/dev/null',
    $descriptorspec,
    $pipes,
    '/tmp',
    ['HOME' => getenv('HOME')]
);

if (!is_resource($process)) {
    echo json_encode(['error' => 'Failed to start opencode']);
    exit(1);
}

fclose($pipes[0]);
$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$return_code = proc_close($process);

// Extract just the answer (first line after the ">" prompt header)
$lines = explode("\n", trim($stdout));
$answer = '';
foreach ($lines as $line) {
    $line = trim($line);
    // Skip empty lines and opencode metadata
    if (empty($line) || str_starts_with($line, '>') || str_starts_with($line, '·')) {
        continue;
    }
    $answer = $line;
    break;
}

if (empty($answer)) {
    $answer = 'Ай-яй-яй, щось пішло не так. Спробуй ще раз.';
}

echo json_encode([
    'answer' => $answer,
    'question' => $question,
]);
