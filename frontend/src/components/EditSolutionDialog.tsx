import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Solution } from '@/types';
import MarkdownEditor from '@/components/MarkdownEditor';

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

  // Character limit constants
  const MAX_CHARACTERS = 10000;

  useEffect(() => {
    if (solution) {
      setEditText(solution.solutionText);
    }
  }, [solution]);

  const handleSave = () => {
    if (solution) {
      onSave(solution.id, editText.trim());
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

        <MarkdownEditor
          value={editText}
          onChange={setEditText}
          placeholder={t('errors:detail.solutionPlaceholder')}
          height={300}
          maxLength={MAX_CHARACTERS}
          showCharacterCount={true}
          showToolbar={true}
        />

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
            disabled={isSaving || !editText.trim() || editText.length > MAX_CHARACTERS}
            className={editText.length > MAX_CHARACTERS ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isSaving ? t('errors:detail.updating') : t('errors:detail.updateSolution')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSolutionDialog;