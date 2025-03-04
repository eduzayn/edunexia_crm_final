import { WebContainer } from '@webcontainer/api';

export interface WebContainerConfig {
  files: Record<string, string>;
  terminal: {
    rows: number;
    cols: number;
  };
  env: Record<string, string>;
}

const packageJsonContent = JSON.stringify({
  name: 'chatwoot-webcontainer',
  version: '1.0.0',
  private: true,
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
  },
  dependencies: {
    '@supabase/supabase-js': 'latest',
    '@tanstack/react-query': 'latest',
    'next': 'latest',
    'react': 'latest',
    'react-dom': 'latest',
    'idb': 'latest',
  },
});

const nextConfigContent = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
}
module.exports = nextConfig
`;

export const webcontainerConfig: WebContainerConfig = {
  files: {
    'package.json': packageJsonContent,
    'next.config.js': nextConfigContent,
  },
  terminal: {
    rows: 24,
    cols: 80,
  },
  env: {
    NODE_ENV: 'development',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
};

export async function initWebContainer() {
  try {
    const webcontainerInstance = await WebContainer.boot();
    await webcontainerInstance.mount(webcontainerConfig.files);
    return webcontainerInstance;
  } catch (error) {
    console.error('Erro ao inicializar WebContainer:', error);
    throw error;
  }
}

export async function startDevServer(webcontainerInstance: WebContainer) {
  try {
    const installProcess = await webcontainerInstance.spawn('npm', ['install']);
    installProcess.output.pipeTo(new WritableStream({
      write(data) {
        console.log(data);
      },
    }));

    await installProcess.exit;

    const devProcess = await webcontainerInstance.spawn('npm', ['run', 'dev']);
    devProcess.output.pipeTo(new WritableStream({
      write(data) {
        console.log(data);
      },
    }));

    return devProcess;
  } catch (error) {
    console.error('Erro ao iniciar servidor de desenvolvimento:', error);
    throw error;
  }
} 