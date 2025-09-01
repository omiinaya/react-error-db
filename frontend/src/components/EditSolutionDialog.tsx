import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { Solution } from '@/types';

interface EditSolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solution: Solution | null;
  onSave: (solutionId: string, solutionText: string) => void;
  isSaving: boolean;
}

const EditSolutionDialog: React.FC<EditSolutionDialogProps> = ({
  open,
  onOpenChange,
  solution,
  onSave,
  isSaving
}) => {
  const { t } = useTranslation();
  const [editText, setEditText] = useState('');
  const [currentLength, setCurrentLength] = useState(0);

  // Character limit constants
  const MAX_CHARACTERS = 10000;
  const WARNING_THRESHOLD = 8000; // 80% of limit
  const charactersRemaining = MAX_CHARACTERS - currentLength;
  const percentageUsed = (currentLength / MAX_CHARACTERS) * 100;

  useEffect(() => {
    if (solution) {
      setEditText(solution.solutionText);
      setCurrentLength(solution.solutionText.length);
    }
  }, [solution]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setEditText(text);
    setCurrentLength(text.length);
  };

  const handleSave = () => {
    if (solution) {
      onSave(solution.id, editText.trim());
    }
  };

  const getCharacterCountColor = () => {
    if (currentLength > MAX_CHARACTERS) {
      return 'text-red-500'; // Over limit - red
    } else if (currentLength > WARNING_THRESHOLD) {
      return 'text-yellow-500'; // Warning zone - yellow/orange
    } else {
      return 'text-muted-foreground'; // Normal - muted color
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('errors:detail.editSolutionTitle')}</DialogTitle>
          <DialogDescription>
            {t('errors:detail.editSolutionDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Textarea
            placeholder={t('errors:detail.solutionPlaceholder')}
            className="min-h-32 pr-16"
            value={editText}
            onChange={handleTextChange}
            disabled={isSaving}
            maxLength={MAX_CHARACTERS}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <div className={`text-xs font-medium ${getCharacterCountColor()} transition-colors duration-200`}>
              {currentLength > MAX_CHARACTERS ? (
                <span className="flex items-center gap-1">
                  <span className="text-red-500">-{Math.abs(charactersRemaining)}</span>
                </span>
              ) : (
                charactersRemaining
              )}
            </div>
            {percentageUsed > 80 && (
              <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Error message in bottom right - only show when there are issues and more than 0 characters */}
        {(currentLength > 0 && (currentLength > MAX_CHARACTERS || currentLength < 10)) && (
          <div className="text-right">
            <div className="text-xs text-red-500 font-medium">
              {currentLength > MAX_CHARACTERS ? (
                <span>{t('errors:detail.characterLimitExceeded')}</span>
              ) : currentLength < 10 ? (
                <span>{t('errors:validation.solutionTextTooSmall')}</span>
              ) : null}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('common:cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !editText.trim() || currentLength > MAX_CHARACTERS}
            className={currentLength > MAX_CHARACTERS ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isSaving ? t('errors:detail.updating') : t('errors:detail.updateSolution')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSolutionDialog;