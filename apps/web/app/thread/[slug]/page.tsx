import { ThreadClient } from './thread-client';

type ThreadPageProps = {
  params: {
    slug: string;
  };
};

export default function ThreadPage({ params }: ThreadPageProps) {
  return <ThreadClient slug={params.slug} />;
}
