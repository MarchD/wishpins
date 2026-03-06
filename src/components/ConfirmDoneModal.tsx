import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

interface ConfirmDoneModalProps {
  open: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
}

export const ConfirmDoneModal = ({
  open,
  isSubmitting,
  onCancel,
  onConfirm,
  title = 'Ти прям точно впевнений? 👀',
  description =
    'Бо тіко закриєш цю сторінку — інші не зможуть це подарувать, а ти не зможеш передумать. А мені було лінь тут щось придумувать ВАХХААХ.',
  cancelLabel = 'Нє, передумав(ла)',
  confirmLabel = 'Так, забираю'
}: ConfirmDoneModalProps) => {
  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{description}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={isSubmitting} variant="outlined" color="inherit">
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} disabled={isSubmitting} variant="contained" color="success">
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
