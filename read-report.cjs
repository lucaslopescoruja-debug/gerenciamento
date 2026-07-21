const fs = require('fs');

const line = fs.readFileSync('C:\\Users\\lucas\\.gemini\\antigravity-ide\\brain\\89dc14dc-9242-4896-abaa-306127b69158\\.system_generated\\logs\\transcript_full.jsonl', 'utf8')
  .split('\n')
  .find(l => {
    try {
      return JSON.parse(l).step_index === 989;
    } catch {
      return false;
    }
  });

if (line) {
  const content = JSON.parse(line).content;
  const actions = content.split('### Step ');
  console.log('Total subagent steps:', actions.length - 1);
  console.log('--- Last 3 Steps ---');
  for (let i = Math.max(1, actions.length - 4); i < actions.length; i++) {
    console.log('### Step ' + actions[i].substring(0, 500) + '\n');
  }
} else {
  console.log('Line not found');
}
