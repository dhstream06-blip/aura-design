'use client';

import { ChangeEvent, FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';

export function UploadForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
    setMessage('');
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setMessage('Pick an image first.');
      return;
    }

    const filePath = `${Date.now()}-${selectedFile.name.replace(/\s+/g, '-')}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('flyers')
      .upload(filePath, selectedFile, { upsert: false });

    if (uploadError) {
      setMessage(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabaseClient.storage.from('flyers').getPublicUrl(filePath);

    const { error: insertError } = await supabaseClient.from('flyers').insert({
      image_url: publicUrlData.publicUrl
    });

    if (insertError) {
      setMessage(insertError.message);
      return;
    }

    setMessage('Uploaded. Everyone can now see this image.');
    setSelectedFile(null);
    (event.currentTarget.elements.namedItem('flyer') as HTMLInputElement).value = '';

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form className="uploadCard" onSubmit={onSubmit}>
      <h2>Upload flyer</h2>
      <p>Every uploaded image is stored in Supabase and visible to everyone.</p>
      <input type="file" name="flyer" accept="image/*" onChange={onFileChange} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Uploading...' : 'Upload image'}
      </button>
      {message ? <p className="message">{message}</p> : null}
    </form>
  );
}
