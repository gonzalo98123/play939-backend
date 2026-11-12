// src/api/billboard/controllers/billboard.ts
import { Context } from 'koa';

export default {
  async getNews(ctx: Context) {
    try {
      const billboardRssUrl = 'https://billboard.ar/feed/';

      const response = await fetch(billboardRssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://billboard.ar/',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al conectar con Billboard Argentina: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      const noticias: Array<{
        titulo: string;
        link: string;
        fecha: string;
        descripcion: string;
        imagen: string | null;
        categoria: string;
      }> = [];

      const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);

      if (itemMatches) {
        for (const itemStr of itemMatches) {
          const titleMatch = itemStr.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
          const linkMatch = itemStr.match(/<link>([\s\S]*?)<\/link>/);
          const dateMatch = itemStr.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
          const categoryMatch = itemStr.match(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>|<category>([\s\S]*?)<\/category>/);
          const descMatch = itemStr.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);
          const contentMatch = itemStr.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);

          // Buscar imagen en media:content, enclosure o dentro del HTML de content:encoded
          const mediaMatch = itemStr.match(/<media:content[^>]+url="([^">]+)"/);
          const enclosureMatch = itemStr.match(/<enclosure[^>]+url="([^">]+)"/);
          const imgTagMatch = (contentMatch?.[1] || '').match(/<img[^>]+src="([^">]+)"/);

          const imagen = mediaMatch?.[1] || enclosureMatch?.[1] || imgTagMatch?.[1] || null;

          // Limpiar descripción (priorizando <description> para que sea un extracto corto)
          const rawDesc = descMatch ? (descMatch[1] || descMatch[2] || '') : (contentMatch?.[1] || '');
          const cleanDesc = rawDesc
            .replace(/<[^>]*>?/gm, '')
            .replace(/&#8230;/g, '...')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&#8216;|&#8217;/g, "'")
            .replace(/&#8220;|&#8221;/g, '"')
            .trim();

          noticias.push({
            titulo: titleMatch ? (titleMatch[1] || titleMatch[2] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '',
            link: linkMatch ? linkMatch[1].trim() : '',
            fecha: dateMatch ? dateMatch[1].trim() : '',
            descripcion: cleanDesc,
            imagen,
            categoria: categoryMatch ? (categoryMatch[1] || categoryMatch[2] || 'Billboard').trim() : 'Billboard',
          });
        }
      }

      ctx.body = {
        success: true,
        fuente: "Billboard Argentina",
        total: noticias.length,
        noticias: noticias.slice(0, 12),
      };

    } catch (error: any) {
      strapi.log.error('Error obteniendo noticias de Billboard Argentina:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        fuente: "Billboard Argentina",
        error: error.message || 'Error al procesar las noticias',
      };
    }
  },
};