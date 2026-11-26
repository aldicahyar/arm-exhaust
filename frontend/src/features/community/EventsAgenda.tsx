'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { agendaDate } from './agenda-date';

export interface AgendaEvent {
  readonly id: string;
  readonly tag: string;
  readonly eventDate: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly href?: string | null;
}

interface EventsAgendaProps {
  readonly tag: string;
  readonly title: string;
  readonly events: readonly AgendaEvent[];
}

const ROW_CLASS =
  'group grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-x-5 gap-y-3 border-t border-[#1E1E21] py-7 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:gap-x-8';

/** Baris agenda: tautan bila event punya `href`, selain itu blok biasa (tetap bisa disorot untuk ganti foto). */
function AgendaRow({
  event,
  onActivate,
  children,
}: Readonly<{ event: AgendaEvent; onActivate: () => void; children: ReactNode }>) {
  if (event.href) {
    return (
      <Link
        href={event.href}
        onMouseEnter={onActivate}
        onFocus={onActivate}
        className={`${ROW_CLASS} rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400`}
      >
        {children}
      </Link>
    );
  }
  return (
    <div onMouseEnter={onActivate} className={ROW_CLASS}>
      {children}
    </div>
  );
}

/**
 * Section 4 beranda — agenda editorial: daftar event bergaris tipis dengan tanggal besar di depan.
 * Desktop: satu foto di kiri berganti mengikuti baris yang disorot/difokus. HP: foto kecil di tiap baris.
 */
export function EventsAgenda({ tag, title, events }: Readonly<EventsAgendaProps>) {
  const [active, setActive] = useState(0);
  if (events.length === 0) return null;

  return (
    <section
      aria-labelledby="events-title"
      className="flex min-h-[calc(100svh-128px)] flex-col justify-center border-t border-[#1E1E21] px-4 sm:px-10 py-20 lg:py-28"
    >
      <p className="font-['Montserrat'] text-[11px] uppercase tracking-[0.22em] text-zinc-400">{tag}</p>
      <h2
        id="events-title"
        className="mt-4 font-['Montserrat'] text-3xl sm:text-4xl lg:text-5xl font-light uppercase tracking-[0.06em] leading-[1.15] text-balance text-white"
      >
        {title}
      </h2>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Desktop: foto event yang sedang disorot (dekoratif — judul ada di daftar) */}
        <div aria-hidden="true" className="relative hidden aspect-[4/3] overflow-hidden bg-[#141416] lg:col-span-5 lg:block">
          {events.map((event, i) => (
            <Image
              key={event.id}
              src={event.imageUrl}
              alt=""
              fill
              sizes="40vw"
              className={`object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none ${
                i === active ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>

        <ul className="border-b border-[#1E1E21] lg:col-span-7">
          {events.map((event, i) => {
            const date = agendaDate(event.eventDate);
            return (
              <li key={event.id}>
                <AgendaRow event={event} onActivate={() => setActive(i)}>
                  <time dateTime={event.eventDate} aria-label={date.label} className="font-['Montserrat'] leading-none">
                    {date.day ? (
                      <span className="block text-4xl font-light text-white tabular-nums">{date.day}</span>
                    ) : null}
                    <span className="mt-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                      {date.month} {date.year}
                    </span>
                  </time>

                  <div className="min-w-0">
                    <p className="font-['Montserrat'] text-[11px] uppercase tracking-[0.22em] text-zinc-400">{event.tag}</p>
                    <h3 className="mt-2 font-['Montserrat'] text-lg sm:text-xl font-light leading-snug text-white underline-offset-4 decoration-zinc-500 group-hover:underline">
                      {event.title}
                    </h3>
                    {event.description ? (
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400 line-clamp-2">{event.description}</p>
                    ) : null}
                    {/* HP/tablet: foto kecil di dalam baris */}
                    <div className="relative mt-4 aspect-[4/3] w-40 overflow-hidden bg-[#141416] lg:hidden">
                      <Image src={event.imageUrl} alt="" fill sizes="160px" className="object-cover" />
                    </div>
                  </div>

                  {event.href ? (
                    <span
                      aria-hidden="true"
                      className="hidden self-center text-xl text-zinc-500 transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-white motion-reduce:transition-none sm:block"
                    >
                      →
                    </span>
                  ) : null}
                </AgendaRow>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
