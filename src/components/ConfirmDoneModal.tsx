import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

interface ConfirmDoneModalProps {
  open: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDoneModal = ({
  open,
  isSubmitting,
  onCancel,
  onConfirm
}: ConfirmDoneModalProps) => {
  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onCancel} fullWidth maxWidth="sm">
      <DialogTitle>Ти прям точно впевнений? 👀</DialogTitle>
      <DialogContent>
        <Typography>
          Бо тіко закриєш цю сторінку — інші не зможуть це подарувать, а ти не зможеш передумать.
          А мені було лінь тут щось придумувать ВАХХААХ.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={isSubmitting} variant="outlined" color="inherit">
          Нє, передумав(ла)
        </Button>
        <Button onClick={onConfirm} disabled={isSubmitting} variant="contained" color="success">
          Так, забираю
        </Button>
      </DialogActions>
    </Dialog>
  );
};
