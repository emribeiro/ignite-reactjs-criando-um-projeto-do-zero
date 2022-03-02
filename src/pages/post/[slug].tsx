import { GetStaticPaths, GetStaticProps } from 'next';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <h1>Carregando...</h1>;
  }

  function formatDate(date): string {
    return format(new Date(date), 'dd MMM yyyy', {
      locale: ptBR,
    });
  }
  function getReadingTime(content): number {
    const data = content.map(body => {
      return body.body.map(b => {
        return b.text;
      });
    });

    const words = data.map(text => {
      return text[0].split(' ').length;
    });
    const readingTime = Math.ceil(
      words.reduce((prev, current) => prev + current, 0) / 200
    );

    return readingTime;
  }
  return (
    <>
      <Head>
        <title>{styles.postHeading} | spaceTravelling</title>
      </Head>
      <div className={commonStyles.postContainer}>
        <Header />
        <div className={styles.postImageContainer}>
          <img src={post.data.banner.url} alt="banner" />
        </div>
        <div className={styles.postHeading}>
          <h1>{post.data.title}</h1>
          <div className={styles.postSubtitle}>
            <span>
              <FiCalendar />
              {formatDate(post.first_publication_date)}
            </span>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />
              {`${getReadingTime(post.data.content)} min`}
            </span>
          </div>
        </div>
        <div className={styles.postBody}>
          {post.data.content.map(content => (
            <div key={content.heading}>
              <h2>{content.heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: content.body }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'blog_post')],
    {
      fetch: ['posts.slug'],
    }
  );

  const params = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths: params,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('blog_post', String(slug), {});

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24,
  };
};
