import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useNavigate } from 'react-router-dom';

interface Photo {
  name: string;
  url: string;
  size: number;
  lastModified: string;
}

export default function PhotoGallery() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [clubId, setClubId] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const autoLoad = async () => {
      if (['PRESIDENT', 'VP'].includes(user.role)) {
        const res = await fetch('http://localhost:3000/club/my-club', {
           headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const club = await res.json();
          setClubId(club.id);
        }
      }
    };
    autoLoad();
  }, [user, navigate, token]);

  useEffect(() => {
    if (clubId) loadGallery();
  }, [clubId]);

  const loadGallery = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/media/gallery/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPhotos(await res.json());
      else alert('Could not load gallery. Check the Club ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !clubId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach(f => formData.append('files', f));
      const res = await fetch(`http://localhost:3000/media/upload/${clubId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        alert('Photos uploaded successfully!');
        loadGallery();
      } else {
        alert('Upload failed. Make sure MinIO is running.');
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (photo: Photo) => {
    const res = await fetch(`http://localhost:3000/media/download/${clubId}/${photo.name}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const canUpload = user?.role === 'PRESIDENT' || user?.role === 'VP' || user?.role === 'MEMBER';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Photo Gallery</h1>
        <p className="text-slate-500 mt-1">Browse, upload, and download club event photos.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Club ID</label>
        <div className="flex gap-3">
          <input type="text" value={clubId} onChange={e => setClubId(e.target.value)}
            className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="Paste the Club UUID here..." />
          <button onClick={loadGallery} disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? 'Loading...' : 'Load Gallery'}
          </button>
        </div>
        {canUpload && clubId && (
          <div className="mt-4">
            <label className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${uploading ? 'bg-slate-300 text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'}`}>
              {uploading ? 'Uploading...' : '📸 Upload Photos'}
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        )}
      </div>

      {photos.length === 0 && !loading ? (
        <p className="text-center text-slate-500 py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          No photos yet. Upload some memories!
        </p>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(n => <div key={n} className="aspect-square bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map(photo => (
            <div key={photo.name}
              className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all"
              onClick={() => setLightbox(photo.url)}>
              <img src={photo.url} alt={photo.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); handleDownload(photo); }}
                  className="px-4 py-2 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-100">
                  ⬇ Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Preview" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
          <button className="absolute top-6 right-6 text-white text-3xl font-black hover:text-rose-400 transition-colors" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
