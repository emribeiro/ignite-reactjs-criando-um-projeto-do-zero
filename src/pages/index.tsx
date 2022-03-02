import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';
import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  console.log(nextPage);

  async function handleNextPage(): Promise<void> {
    const response = await fetch(nextPage);
    const data = await response.json();
    setNextPage(data.next_page);

    const nextPosts = data.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        slug: post.uid,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });
    setPosts(prevState => [...prevState, ...nextPosts]);
  }

  function formatDate(date): string {
    return format(new Date(date), 'dd MMM yyyy', {
      locale: ptBR,
    });
  }
  return (
    <>
      <Header />
      <div className={styles.postsContainer}>
        {posts.map(post => (
          <div className={styles.postContainer}>
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
              </a>
            </Link>
            <p>{post.data.subtitle}</p>
            <div>
              <time>
                <FiCalendar />
                {formatDate(post.first_publication_date)}
              </time>
              <span>
                <FiUser />
                {post.data.author}
              </span>
            </div>
          </div>
        ))}
        <footer>
          {nextPage && (
            <button type="button" onClick={handleNextPage}>
              Carregar mais posts
            </button>
          )}
        </footer>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'blog_post'),
    {
      fetch: [
        'blog_post.title',
        'blog_post.subtitle',
        'blog_post.author',
        'blog_post.content',
        'blog_post.slug',
      ],
      pageSize: 2,
    }
  );

  const postPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    }),
  };

  return {
    props: {
      postsPagination: postPagination,
    },
  };
};
