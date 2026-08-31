# FlixWorld — Short Drama

A modern, mobile-optimized short drama streaming app built with React + Vite + Tailwind CSS.

Powered by the [ReelShort public API](https://reelshort.vercel.app/).

## Features

- 📱 Full-screen vertical video player with swipe navigation (TikTok-style)
- 🎬 HLS streaming with hls.js
- 🔍 Search + trending
- 🏆 Rankings (trending / latest)
- 🌐 Multi-language support
- ⚡ Code-split bundle — hls.js only loads on the watch page

## Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- React Router 6
- hls.js
- Zustand (language store)

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
```
