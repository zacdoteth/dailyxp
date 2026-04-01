import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const markup = {
  type: 'div',
  props: {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#050509',
      position: 'relative', overflow: 'hidden',
    },
    children: [
      // Aurora orb 1 - indigo top left
      {
        type: 'div',
        props: {
          style: {
            position: 'absolute', width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(123,97,255,0.3) 0%, transparent 70%)',
            top: -150, left: -100,
          },
        },
      },
      // Aurora orb 2 - rose right
      {
        type: 'div',
        props: {
          style: {
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,88,122,0.2) 0%, transparent 70%)',
            top: 100, right: -100,
          },
        },
      },
      // Aurora orb 3 - cyan bottom
      {
        type: 'div',
        props: {
          style: {
            position: 'absolute', width: 450, height: 450, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)',
            bottom: -100, left: 250,
          },
        },
      },
      // Gold glow behind logo
      {
        type: 'div',
        props: {
          style: {
            position: 'absolute', width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,168,56,0.15) 0%, transparent 60%)',
          },
        },
      },
      // Logo
      {
        type: 'div',
        props: {
          style: { display: 'flex', alignItems: 'baseline', gap: 0 },
          children: [
            {
              type: 'span',
              props: {
                style: { fontSize: 108, fontWeight: 800, color: '#EDE9E0', letterSpacing: -5 },
                children: 'DAILY',
              },
            },
            {
              type: 'span',
              props: {
                style: { fontSize: 108, fontWeight: 800, color: '#E8A838', letterSpacing: -5 },
                children: 'XP',
              },
            },
          ],
        },
      },
      // Tagline with lines
      {
        type: 'div',
        props: {
          style: { display: 'flex', alignItems: 'center', gap: 20, marginTop: 16 },
          children: [
            {
              type: 'div',
              props: { style: { width: 50, height: 1, background: 'rgba(112,107,128,0.5)' } },
            },
            {
              type: 'span',
              props: {
                style: {
                  fontSize: 17, fontWeight: 400, letterSpacing: 7, color: '#706B80',
                  textTransform: 'uppercase',
                },
                children: 'life is more fun as a video game',
              },
            },
            {
              type: 'div',
              props: { style: { width: 50, height: 1, background: 'rgba(112,107,128,0.5)' } },
            },
          ],
        },
      },
      // Bottom URL
      {
        type: 'div',
        props: {
          style: {
            position: 'absolute', bottom: 44, display: 'flex', alignItems: 'center', gap: 10,
          },
          children: [
            {
              type: 'span',
              props: {
                style: { fontSize: 15, fontWeight: 500, letterSpacing: 4, color: '#3E3A4C' },
                children: 'dailyxp.app',
              },
            },
          ],
        },
      },
    ],
  },
};

// Fetch Inter font (400 and 800 weights)
const fontData = await fetch(
  'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf'
).then(r => r.arrayBuffer());

const fontBold = await fetch(
  'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYMZg.ttf'
).then(r => r.arrayBuffer());

const svg = await satori(markup, {
  width: 1200,
  height: 630,
  fonts: [
    { name: 'Inter', data: fontData, weight: 400, style: 'normal' },
    { name: 'Inter', data: fontBold, weight: 800, style: 'normal' },
  ],
});

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
});
const pngData = resvg.render();
const pngBuffer = pngData.asPng();

const outPath = join(__dirname, '..', 'public', 'og.png');
writeFileSync(outPath, pngBuffer);
console.log(`OG image generated: ${outPath} (${(pngBuffer.length / 1024).toFixed(1)}KB)`);
