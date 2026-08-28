import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: 'Honey Montana — блог',
    description: 'Гайды по IT, Python, QA, системному анализу и Linux.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: '<language>ru-ru</language>',
  });
}
