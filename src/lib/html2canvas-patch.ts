import html2canvas from 'html2canvas';

// Helper to convert any oklch color string to rgb/hex using the browser's own canvas parser
const resolveOklchToRgb = (oklchStr: string): string => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'rgb(100, 116, 139)';
    ctx.fillStyle = oklchStr;
    const resolved = ctx.fillStyle;
    
    // Check if the resolved value is valid and not oklch
    if (resolved && resolved !== '#000000' && resolved !== 'rgb(0, 0, 0)' && !resolved.includes('oklch')) {
      return resolved;
    }
    
    // Handle fallback if it resolves to black but is actually a light oklch background
    if (resolved === '#000000' || resolved === 'rgb(0, 0, 0)') {
      const match = oklchStr.match(/oklch\(\s*([0-9.]+)/);
      if (match && parseFloat(match[1]) > 0.85) {
        return 'rgb(248, 250, 252)'; // light slate background fallback
      }
    }
    
    return resolved || 'rgb(100, 116, 139)';
  } catch (e) {
    return 'rgb(100, 116, 139)';
  }
};

export default async function safeHtml2Canvas(element: HTMLElement, options?: any): Promise<HTMLCanvasElement> {
  const originalStyles: { element: HTMLStyleElement; text: string }[] = [];
  const originalLinks: { link: HTMLLinkElement; tempStyle: HTMLStyleElement }[] = [];

  try {
    // 1. Process inline <style> elements
    const styleElements = Array.from(document.querySelectorAll('style'));
    styleElements.forEach((styleEl) => {
      const text = styleEl.textContent || '';
      if (text.includes('oklch')) {
        originalStyles.push({ element: styleEl, text });
        
        // Match oklch(...) occurrences and replace them with standard colors
        const cleanedText = text.replace(/oklch\([^)]+\)/g, (match) => {
          return resolveOklchToRgb(match);
        });
        
        styleEl.textContent = cleanedText;
      }
    });

    // 2. Process external <link rel="stylesheet"> elements from same origin
    const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    for (const link of linkElements) {
      try {
        if (!link.href) continue;
        const url = new URL(link.href, window.location.origin);
        if (url.origin !== window.location.origin) continue;

        const response = await fetch(link.href);
        if (!response.ok) continue;

        let text = await response.text();
        if (text.includes('oklch')) {
          const cleanedText = text.replace(/oklch\([^)]+\)/g, (match) => {
            return resolveOklchToRgb(match);
          });

          const tempStyle = document.createElement('style');
          tempStyle.setAttribute('data-html2canvas-temp-style', 'true');
          tempStyle.textContent = cleanedText;
          document.head.appendChild(tempStyle);

          // Temporarily disable the original link tag
          link.disabled = true;

          originalLinks.push({ link, tempStyle });
        }
      } catch (e) {
        // Log silently or ignore cross-origin fetch failures
        console.warn('[html2canvas-patch] Failed to pre-process stylesheet:', link.href, e);
      }
    }

    // 3. Run html2canvas
    return await html2canvas(element, options);

  } finally {
    // 4. Restore everything back to original state
    originalStyles.forEach(({ element, text }) => {
      element.textContent = text;
    });

    originalLinks.forEach(({ link, tempStyle }) => {
      link.disabled = false;
      if (tempStyle.parentNode) {
        tempStyle.parentNode.removeChild(tempStyle);
      }
    });
  }
}
