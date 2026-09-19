import { useEffect, useRef, useState } from 'react';

const stops = [
  { name: 'Baird Terminal', time: '5:15 PM' },
  { name: 'Golebie Grand', time: '5:53 PM' },
  { name: 'Baldasare Union', time: '6:36 PM' },
  { name: 'Grimm Central', time: '7:05 PM' },
  { name: 'Gormley Junction', time: '7:47 PM' },
  { name: 'McGee Metro', time: '8:17 PM' },
  { name: 'Cannella Crossing', time: '8:52 PM' },
  { name: 'Brasacchio Boulevard', time: '9:36 PM' },
  { name: 'Holliday Heights', time: '10:17 PM' },
  { name: 'Styler Station', time: '10:55 PM' },
];

function fileFor(index: number, kind: 'photos' | 'downloads') {
  const number = String(index + 1).padStart(2, '0');
  return kind === 'photos' ? `/2026/photos/stop-${number}.webp` : `/2026/downloads/stop-${number}.jpg`;
}

export default function ArchiveApp() {
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);

  const close = () => {
    dialogRef.current?.close();
    setActive(null);
  };
  const move = (direction: number) => {
    setActive((current) => current === null ? null : (current + direction + stops.length) % stops.length);
  };

  useEffect(() => {
    if (active !== null && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [active]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (active === null) return;
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [active]);

  return <div className="archive-shell">
    <header className="archive-header">
      <img src="/SHBACExpress.png" alt="SHBAC Express" />
      <img src="/goat4.png" alt="" />
    </header>

    <main>
      <section className="archive-date">
        <h1>9th Annual<br />Le Tour de South Hillbillies</h1>
        <p>FRIDAY · SEPTEMBER 18, 2026</p>
      </section>

      <section className="archive-stats" aria-label="Activity statistics">
        <div><strong>10.1</strong><span>miles</span></div>
        <div><strong>1,464</strong><span>feet climbed</span></div>
        <div><strong>9:33<small>/mi</small></strong><span>average pace</span></div>
        <div><strong>24<small>min</small></strong><span>average stop</span></div>
      </section>

      <section className="archive-intro" id="photos">
        <p className="eyebrow">ALL ABOARD</p>
        <p>Tap any photo to view it full-screen.</p>
      </section>

      <ol className="photo-line">
        {stops.map((stop, index) => <li className="photo-stop" key={stop.name}>
          <div className="photo-stop__marker"><span>{index + 1}</span></div>
          <article>
            <button className="photo-stop__image" onClick={() => setActive(index)} aria-label={`Open group photo from ${stop.name}`}>
              <img src={fileFor(index, 'photos')} alt={`Group photo at ${stop.name}`} loading={index < 2 ? 'eager' : 'lazy'} />
              <span>View photo</span>
            </button>
            <div className="photo-stop__caption">
              <div><small>{stop.time} · STOP {String(index + 1).padStart(2, '0')}</small><h3>{stop.name}</h3></div>
              <a href={fileFor(index, 'downloads')} download={`le-tour-2026-${String(index + 1).padStart(2, '0')}.jpg`} aria-label={`Download full-resolution photo from ${stop.name}`}>Download <span aria-hidden="true">↓</span></a>
            </div>
          </article>
        </li>)}
      </ol>

      <section className="archive-download">
        <p>Download all photos in a single file.</p>
        <a className="archive-button archive-button--primary" href="/2026/le-tour-2026-photos.zip" download>Download all photos · 20 MB</a>
      </section>
    </main>

    <footer>
      <strong>9TH ANNUAL LE TOUR DE SOUTH HILLBILLIES</strong>
    </footer>

    <dialog ref={dialogRef} className="lightbox" onClose={() => setActive(null)} onClick={(event) => { if (event.target === dialogRef.current) close(); }}>
      {active !== null && <div className="lightbox__inner"
        onTouchStart={(event) => { touchStart.current = event.changedTouches[0].clientX; }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const distance = event.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
          touchStart.current = null;
        }}>
        <button className="lightbox__close" onClick={close} aria-label="Close photo">×</button>
        <button className="lightbox__nav lightbox__nav--previous" onClick={() => move(-1)} aria-label="Previous photo">‹</button>
        <img src={fileFor(active, 'photos')} alt={`Group photo at ${stops[active].name}`} />
        <button className="lightbox__nav lightbox__nav--next" onClick={() => move(1)} aria-label="Next photo">›</button>
        <div className="lightbox__caption">
          <div><small>{active + 1} / {stops.length} · {stops[active].time}</small><strong>{stops[active].name}</strong></div>
          <a href={fileFor(active, 'downloads')} download={`le-tour-2026-${String(active + 1).padStart(2, '0')}.jpg`}>Full resolution ↓</a>
        </div>
      </div>}
    </dialog>
  </div>;
}
