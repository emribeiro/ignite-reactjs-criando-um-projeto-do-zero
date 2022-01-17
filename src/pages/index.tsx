import { GetStaticProps } from 'next';

import { Head } from 'next/document';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function Home({ postsPagination }: HomeProps) {
  return (
    <>
      <div>
        <div>
          <h3>spacetraveling</h3>
        </div>
        {postsPagination.results.map(post => (
          <>
            <h1>{post.data.title}</h1>
            <p>{post.data.subtitle}</p>
            <div>
              <time>{post.first_publication_date}</time>
              <span>{post.data.author}</span>
            </div>
          </>
        ))}
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
      ],
      pageSize: 2,
    }
  );

  const postPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: new Date(
          post.first_publication_date
        ).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
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
