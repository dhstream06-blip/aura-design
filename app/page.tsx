import Image from 'next/image';
import { UploadForm } from '@/components/upload-form';
import { supabaseServer } from '@/lib/supabase/server';

type Flyer = {
  id: string;
  image_url: string;
  created_at: string;
};

async function getFlyers() {
  const { data, error } = await supabaseServer
    .from('flyers')
    .select('id, image_url, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return [] as Flyer[];
  }

  return data as Flyer[];
}

export default async function Page() {
  const flyers = await getFlyers();

  return (
    <main className="pageWrap">
      <section className="heroCard">
        <div className="logo">Aura Design</div>
        <h1>Public flyer wall</h1>
        <p>Upload once, keep forever, and let everyone view it instantly.</p>
      </section>

      <UploadForm />

      <section className="gallery">
        {flyers.length === 0 ? (
          <div className="emptyState">No image yet. Upload your first flyer.</div>
        ) : (
          flyers.map((flyer) => (
            <article key={flyer.id} className="imageCard">
              <Image src={flyer.image_url} alt="Uploaded flyer" width={1200} height={1200} />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
