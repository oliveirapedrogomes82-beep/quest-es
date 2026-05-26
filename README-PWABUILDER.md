# Revisor Inteligente — pacote para PWABuilder sem computador

Este pacote é estático: não precisa rodar `npm install` nem `npm run build`.
Ele foi feito para ser hospedado em HTTPS e lido pelo PWABuilder.

## Como usar sem computador

1. Extraia este ZIP no celular.
2. Hospede a pasta extraída em um serviço estático com HTTPS, por exemplo Netlify Drop, Static.app, GitHub Pages ou Cloudflare Pages.
   - No Netlify Drop, envie a pasta inteira `revisor-pwabuilder-online`.
3. Copie a URL HTTPS gerada.
4. Abra https://www.pwabuilder.com/
5. Cole a URL do app.
6. Vá em Package / Android.
7. Gere o pacote Android.

## Arquivos importantes

- `index.html`: app final.
- `manifest.webmanifest`: dados de instalação do app.
- `sw.js`: service worker para PWA/offline.
- `icons/`: ícones exigidos para Android/PWA.

## Observação importante

O PWABuilder normalmente precisa de uma URL pública HTTPS para analisar o app. Abrir o arquivo HTML direto no celular não basta para gerar APK.
