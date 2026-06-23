type LogLevel = 'info' | 'success' | 'error' | 'warning' | 'dim';

const ICONS: Record<LogLevel, string> = {
  info: 'ℹ️ ',
  success: '✅',
  error: '❌',
  warning: '⚠️ ',
  dim: '   ',
};

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

export const logger = {
  info(message: string): void {
    console.log(`${ICONS.info} ${message}`);
  },

  success(message: string): void {
    console.log(`${COLORS.green}${ICONS.success} ${message}${COLORS.reset}`);
  },

  error(message: string): void {
    console.error(`${COLORS.red}${ICONS.error} ${message}${COLORS.reset}`);
  },

  warning(message: string): void {
    console.warn(`${COLORS.yellow}${ICONS.warning} ${message}${COLORS.reset}`);
  },

  dim(message: string): void {
    console.log(`${COLORS.dim}${message}${COLORS.reset}`);
  },

  bold(message: string): void {
    console.log(`${COLORS.bold}${message}${COLORS.reset}`);
  },

  highlight(label: string, value: string): void {
    console.log(`\n${COLORS.cyan}${COLORS.bold}${label}${COLORS.reset}\n`);
    // Print subject line bold, body lines normal — indent every line by 2 spaces
    const [subject, ...bodyLines] = value.split('\n');
    console.log(`  ${COLORS.bold}${subject}${COLORS.reset}`);
    if (bodyLines.length > 0) {
      for (const line of bodyLines) {
        // Empty separator line
        if (line.trim() === '') {
          console.log('');
        } else {
          console.log(`  ${COLORS.dim}${line}${COLORS.reset}`);
        }
      }
    }
    console.log('');
  },

  newline(): void {
    console.log('');
  },
};
