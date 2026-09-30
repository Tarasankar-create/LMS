import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { emblemUrl, getImage, type ImageSlug } from '@/assets/images/images';

const COLLEGE = {
  name: 'Pathani Samanta College',
  nameOdia: 'ପଠାଣି ସାମନ୍ତ ମହାବିଦ୍ୟାଳୟ',
  location: 'Khandapara, Nayagarh District, Odisha',
  locationOdia: 'ଖଣ୍ଡପଡ଼ା, ନୟାଗଡ଼',
  tagline: 'Empowering Education, Inspiring Excellence, and Building a Brighter Future',
};

/** Campus scenes that cross-fade behind the sign-in card, in this order. Each one holds for `SLIDE_SECONDS`. */
const SLIDES: ImageSlug[] = ['hero-gate', 'campus-lawn', 'classroom-lecture', 'library', 'annual-function', 'classroom-learn'];
const SLIDE_SECONDS = 6;

/**
 * Slow, looping slideshow of college imagery. Pure CSS (see `.auth-slide` in index.css): each slide gets the same
 * animation offset by its position, so they overlap into a cross-fade. Only the first image is fetched up front;
 * the rest are given their `src` once it has painted, so the sign-in form is never waiting on six pictures.
 */
function CampusSlideshow() {
  const [firstLoaded, setFirstLoaded] = useState(false);
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden bg-primary-900">
      {SLIDES.map((slug, i) => {
        const image = getImage(slug);
        const show = i === 0 || firstLoaded;
        return (
          <img
            key={slug}
            src={show ? image.src : undefined}
            srcSet={show ? image.srcSet : undefined}
            sizes="100vw"
            width={image.width}
            height={image.height}
            alt=""
            decoding="async"
            fetchPriority={i === 0 ? 'high' : 'low'}
            onLoad={i === 0 ? () => setFirstLoaded(true) : undefined}
            className="auth-slide absolute inset-0 h-full w-full object-cover"
            style={{ animationDuration: `${SLIDES.length * SLIDE_SECONDS}s`, animationDelay: `${i * SLIDE_SECONDS}s` }}
          />
        );
      })}
      {/* Navy wash keeps the college colours and the white text legible on any frame. */}
      <div className="absolute inset-0 bg-primary-900/93 lg:hidden" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-primary-900/95 via-primary-900/85 via-45% to-primary-900/50 lg:block" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary-900/90 to-transparent" />
    </div>
  );
}

export function AuthLayout() {
  const site = COLLEGE;
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-primary-900">
      <CampusSlideshow />
      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl content-center items-center gap-8 px-4 py-10 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="text-center text-white lg:text-left">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-white p-2.5 shadow-lg lg:mx-0">
            <img src={emblemUrl} width={66} height={80} alt="" className="h-14 w-auto lg:h-20" />
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-5xl">{site.name}</h1>
          <p lang="or" className="mt-1.5 text-sm text-white sm:text-base lg:text-lg">
            {[site.nameOdia, site.locationOdia].filter(Boolean).join(', ')}
          </p>
          <p className="mt-1 text-sm text-white">{site.location}</p>
          <span aria-hidden className="mx-auto mt-5 block h-1 w-16 rounded-full bg-gold-500 lg:mx-0" />
          <p className="mt-5 hidden max-w-md text-lg leading-relaxed text-white lg:block">{site.tagline}</p>
          <p className="mt-4 inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm lg:mt-6">
            Library Management System
          </p>
        </div>

        <div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
          <div className="rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-white/20 sm:p-8">
            <Outlet />
          </div>
        </div>

        <p className="text-center text-xs text-white/80 lg:col-span-2">
          Library Management System — demo build · Background pictures are illustrative artwork
        </p>
      </div>
    </div>
  );
}
