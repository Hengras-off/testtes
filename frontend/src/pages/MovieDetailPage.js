import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Plus, Check, X, ChevronLeft } from 'lucide-react';
import ReactPlayer from 'react-player/youtube';
import { getMovieDetails, getTVDetails, getImageUrl, getTrailerUrl } from '../services/tmdb';
import { useWatchlist } from '../contexts/WatchlistContext';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingSpinner';
import { MovieCard } from '../components/MovieCard';

export const MovieDetailPage = () => {
  const { mediaType, id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = mediaType === 'movie'
          ? await getMovieDetails(id)
          : await getTVDetails(id);
        setDetails(data);
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('Не удалось загрузить информацию');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [mediaType, id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!details) return <ErrorMessage message="Контент не найден" />;

  const trailerUrl = getTrailerUrl(details.videos);
  const inWatchlist = isInWatchlist(details.id);
  const similar = details.similar?.results || details.recommendations?.results || [];

  const handleWatchlistToggle = () => {
    if (inWatchlist) {
      removeFromWatchlist(details.id);
    } else {
      addToWatchlist({ ...details, media_type: mediaType });
    }
  };

  return (
    <div className="min-h-screen" data-testid="movie-detail-page">
      {/* Hero Section */}
      <div className="relative h-[70vh] md:h-[90vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={getImageUrl(details.backdrop_path, 'original')}
            alt={details.title || details.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-4 md:left-8 z-10 p-3 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full transition-colors"
          data-testid="back-button"
          aria-label="Назад"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="relative h-full max-w-[1600px] mx-auto px-4 md:px-8 flex items-end pb-16">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[0.9]">
              {details.title || details.name}
            </h1>

            <div className="flex items-center space-x-4 text-sm md:text-base">
              <span className="text-brand-primary font-bold text-xl">
                {details.vote_average?.toFixed(1)} / 10
              </span>
              <span className="text-muted-foreground">
                {new Date(details.release_date || details.first_air_date).getFullYear()}
              </span>
              {details.runtime && (
                <span className="text-muted-foreground">{details.runtime} мин</span>
              )}
              {details.number_of_seasons && (
                <span className="text-muted-foreground">
                  {details.number_of_seasons} сезон{details.number_of_seasons > 1 ? 'а' : ''}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {details.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-4 pt-4">
              {trailerUrl && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="bg-brand-primary hover:bg-brand-hover text-white rounded-md px-8 py-3 font-bold transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,59,48,0.3)] flex items-center space-x-2"
                  data-testid="play-trailer-button"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Смотреть трейлер</span>
                </button>
              )}

              <button
                onClick={handleWatchlistToggle}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-colors"
                data-testid="watchlist-toggle-button"
                aria-label={inWatchlist ? 'Удалить из списка' : 'Добавить в список'}
              >
                {inWatchlist ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Details Section */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-16 space-y-12">
        {/* Overview */}
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">Описание</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {details.overview || 'Описание отсутствует'}
          </p>
        </div>

        {/* Cast */}
        {details.credits?.cast && details.credits.cast.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">В ролях</h2>
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {details.credits.cast.slice(0, 10).map((actor) => (
                <div
                  key={actor.id}
                  className="flex-shrink-0 w-32 space-y-2 text-center"
                  data-testid={`cast-member-${actor.id}`}
                >
                  <div className="aspect-square rounded-full overflow-hidden bg-muted">
                    {actor.profile_path ? (
                      <img
                        src={getImageUrl(actor.profile_path, 'w185')}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        👤
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-sm">{actor.name}</p>
                  <p className="text-xs text-muted-foreground">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">Похожее</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {similar.slice(0, 12).map((item, index) => (
                <MovieCard key={item.id} movie={item} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailerUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setShowTrailer(false)}
          data-testid="trailer-modal"
        >
          <div
            className="relative w-full max-w-5xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              data-testid="close-trailer-button"
              aria-label="Закрыть"
            >
              <X className="w-6 h-6" />
            </button>
            <ReactPlayer
              url={trailerUrl}
              playing
              controls
              width="100%"
              height="100%"
              config={{
                youtube: {
                  playerVars: { autoplay: 1 }
                }
              }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};
