import { useState } from 'react';
import Link from 'next/link';
import { splitArrayAlternating } from '../utils/arrays';
import { getAppConfig } from '../io/config';
import { getImages, getProjects, getPortfolios } from '../io/content';
import Image from '../components/Image';
import ColumnLayout from '../components/ColumnLayout';
import Lightbox from '../components/Lightbox';

const THUMBNAIL_COLUMNS = 2;
const THUMBNAIL_PADDING = 1;

const ThumbnailButton = ({ image, appConfig, imageProps, onClick }) => (
  <div className="Thumbnail">
    <button
      title="View Image"
      type="button"
      className="button-reset bn pa0 db w-100 pointer"
      onClick={onClick}
    >
      <Image
        image={image}
        appConfig={appConfig}
        size="50vw"
        className="w-100 db"
        {...imageProps}
      />
    </button>
  </div>
);

const ThumbnailLink = ({ image, appConfig, imageProps, href, as }) => (
  <div className="Thumbnail">
    <Link
      href={href}
      as={as}
    >
      <a className="pa0 db w-100">
        <Image
          image={image}
          appConfig={appConfig}
          size="50vw"
          className="w-100 db"
          {...imageProps}
        />
      </a>
    </Link>
  </div>
);

const ThumbnailColumn = ({ slug, items, images, projects, appConfig, setLightboxImage }) => (
  <div>
    {items.map((item, index) => {
      // lazy-load thumbnails below the fold
      const thumbnailImageProps = index > 0 ? { loading: 'lazy' } : {};

      switch(item.type) {
        case 'image':
          if (!item.filename) {
            console.error(`Invalid data: item ${index} in column has type 'image' but does not have a filename property`);
            return null;
          }

          const image = images.find(data => data.filename === item.filename);

          if (!image) {
            console.error(`Missing image data for ${item.filename}`);
            return null;
          }

          return (
            <div key={image.filename} className="mb2">
              <ThumbnailButton
                image={image}
                appConfig={appConfig}
                onClick={() => setLightboxImage(image)}
                imageProps={thumbnailImageProps}
              />
            </div>
          );
        case 'project':
          if (!item.slug) {
            console.error(`Invalid data: item ${index} in column has type 'project' but does not have a slug property`);
            return null;
          }

          const project = projects.find(data => data.slug === item.slug);

          if (!project) {
            console.error(`Missing project data for ${item.slug}`);
            return null;
          }

          if (!project.thumbnailImage) {
            console.error(`Invalid data: project ${project.slug} does not have a thumbnailImage property`)
            return null;
          }

          if (!project.thumbnailImage.filename) {
            console.error(`Invalid data: project ${project.slug} thumbnailImage does not have a filename property`)
            return null;
          }

          const thumbnailImage = images.find(data => data.filename === project.thumbnailImage.filename);

          if (!thumbnailImage) {
            console.error(`Missing image data for ${project.thumbnailImage.filename}`);
            return null;
          }

          return (
            <div className="mb4" key={project.slug}>
              <ThumbnailLink
                image={thumbnailImage}
                appConfig={appConfig}
                href="/projects/[portfolioSlug]/[slug]"
                as={`/projects/${slug}/${project.slug}`}
                imageProps={thumbnailImageProps}
              />
              <div className="flex flex-column items-center justify-center pa2 pb3 bb bw1 b--light-gray lh-title">
                <h2 className="tc fw2 mt0 mb3 f4 f3-ns">{project.title}</h2>
                <Link href="/projects/[portfolioSlug]/[slug]" as={`/projects/${slug}/${project.slug}`}>
                  <a className="tc ttl f5 flex items-center">View Project</a>
                </Link>
              </div>
            </div>
          );
        default:
          console.error(`Invalid images data: item ${index} in column did not have a recognised type`);
          return null;
      }
    })}
  </div>
);

const Portfolio = ({ appConfig, data: { slug, items, images, projects } }) => {
  const [lightboxImage, setLightboxImage] = useState(null);

  const isLightboxOpen = !!lightboxImage;

  const itemColumns = splitArrayAlternating(items, THUMBNAIL_COLUMNS);

  return (
    <div className="flex flex-wrap">
      <nav className="ph4 pt2 w-100 w-20-l">
        <div className="sticky-l top-2">
          <ul className="flex flex-row flex-column-l justify-center justify-start-l list pa0 ma0 mr2 mr0-ns f4 fw2 ttl">
            <li className="mb3 mr4 mr0-l flex flex-row items-center">
              <span className={`f6 mr2${slug === 'illustration' ? '' : ' o-0'}`}>•</span>
              <Link href="/[slug]" as="/illustration"><a className="no-underline">illustration</a></Link>
            </li>
            <li className="mb3 flex flew-row items-center">
              <span className={`f6 mr2${slug === 'design' ? '' : '  o-0'}`}>•</span>
              <Link href="/[slug]" as="/design"><a className="no-underline">design</a></Link>
            </li>
          </ul>
        </div>
      </nav>
      <main className="w-80-l">
        <ColumnLayout
          columns={THUMBNAIL_COLUMNS}
          verticalPadding={THUMBNAIL_PADDING}
          horizontalPadding={THUMBNAIL_PADDING}
        >
          {itemColumns.map((items, i) => (
            <ThumbnailColumn
              key={i}
              slug={slug}
              items={items}
              images={images}
              projects={projects}
              appConfig={appConfig}
              setLightboxImage={setLightboxImage}
            />
          ))}
        </ColumnLayout>
        <Lightbox
          isOpen={isLightboxOpen}
          image={lightboxImage}
          appConfig={appConfig}
          onClose={() => setLightboxImage(null)}
        />
      </main>
    </div>
  );
};

export const getStaticProps = async ({ params }) => {
  const appConfig = await getAppConfig();
  const portfolios = await getPortfolios();
  const projects = await getProjects();
  const images = await getImages();

  const { slug, items } = portfolios.find(data => data.slug === params.slug);

  return {
    props: {
      appConfig,
      data: {
        slug,
        items,
        projects,
        images,
      },
    },
  };
};

export const getStaticPaths = async () => {
  const portfolios = await getPortfolios();

  const paths = portfolios.map(({ slug }) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};

export default Portfolio;
