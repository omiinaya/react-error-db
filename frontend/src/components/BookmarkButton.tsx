import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';

interface BookmarkButtonProps {
  solutionId: string;
  initialIsBookmarked?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export function BookmarkButton({
  solutionId,
  initialIsBookmarked = false,
  onBookmarkChange,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [loading, setLoading] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  useEffect(() => {
    checkBookmarkStatus();
  }, [solutionId]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await api.checkBookmark(solutionId);
      setIsBookmarked(response.isBookmarked);
    } catch (error) {
      console.error('Failed to check bookmark status:', error);
    }
  };

  const handleToggleBookmark = async () => {
    setLoading(true);
    try {
      if (isBookmarked && bookmarkId) {
        await api.deleteBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
        toast.success('Bookmark removed');
      } else {
        const response = await api.createBookmark(solutionId);
        setIsBookmarked(true);
        setBookmarkId(response.bookmark?.id || null);
        toast.success('Bookmark added');
      }
      onBookmarkChange?.(!isBookmarked);
    } catch (error) {
      toast.error('Failed to update bookmark');
      console.error('Bookmark error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleBookmark}
      disabled={loading}
      className={isBookmarked ? 'text-yellow-500' : ''}
    >
      <Bookmark
        className="h-4 w-4"
        fill={isBookmarked ? 'currentColor' : 'none'}
      />
      <span className="ml-1">
        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </span>
    </Button>
  );
}
