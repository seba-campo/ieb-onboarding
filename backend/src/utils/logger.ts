type Level = 'info' | 'warn' | 'error' | 'debug';

function log(level: Level, msg: string, ctx: any = {}): void {
  const entry = { ts: new Date().toISOString(), level, msg, ...ctx };
  const line = JSON.stringify(entry) + '\n';
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const logger = {
  info: (msg: string, ctx?: any) => log('info', msg, ctx),
  warn: (msg: string, ctx?: any) => log('warn', msg, ctx),
  error: (msg: string, ctx?: any) => log('error', msg, ctx),
  debug: (msg: string, ctx?: any) => log('debug', msg, ctx),
};
