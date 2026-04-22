const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const message = document.getElementById('message');
const gallery = document.getElementById('gallery');

if (!window.APP_CONFIG?.SUPABASE_URL || !window.APP_CONFIG?.SUPABASE_ANON_KEY) {
  message.textContent = 'Bitte config.js mit Supabase URL + Token ausfüllen.';
  message.style.color = '#ff7a98';
  uploadBtn.disabled = true;
} else {
  startApp();
}

function startApp() {
  const supabase = window.supabase.createClient(
    window.APP_CONFIG.SUPABASE_URL,
    window.APP_CONFIG.SUPABASE_ANON_KEY
  );

  uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files?.[0];

    if (!file) {
      setMessage('Bitte zuerst ein Bild wählen.', true);
      return;
    }

    uploadBtn.disabled = true;
    setMessage('Upload läuft ...');

    const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filePath = `${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('flyers')
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      setMessage(`Upload Fehler: ${uploadError.message}`, true);
      uploadBtn.disabled = false;
      return;
    }

    const { data } = supabase.storage.from('flyers').getPublicUrl(filePath);

    const { error: insertError } = await supabase.from('flyers').insert({
      image_url: data.publicUrl
    });

    if (insertError) {
      setMessage(`DB Fehler: ${insertError.message}`, true);
      uploadBtn.disabled = false;
      return;
    }

    fileInput.value = '';
    setMessage('Erfolgreich hochgeladen. Für alle sichtbar!');
    uploadBtn.disabled = false;
    await loadGallery(supabase);
  });

  loadGallery(supabase);
}

async function loadGallery(supabase) {
  gallery.innerHTML = '';

  const { data, error } = await supabase
    .from('flyers')
    .select('id, image_url')
    .order('created_at', { ascending: false });

  if (error) {
    setMessage(`Lesefehler: ${error.message}`, true);
    return;
  }

  if (!data.length) {
    gallery.innerHTML = '<p>Noch keine Bilder vorhanden.</p>';
    return;
  }

  data.forEach((item) => {
    const tile = document.createElement('article');
    tile.className = 'tile';
    tile.innerHTML = `<img src="${item.image_url}" alt="Flyer" loading="lazy" />`;
    gallery.appendChild(tile);
  });
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? '#ff7a98' : '#96ffc8';
}
