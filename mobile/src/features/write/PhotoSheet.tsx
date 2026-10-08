import { Button } from '@/ui/Button';
import { Sheet } from '@/ui/Sheet';

export function PhotoSheet({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (s: 'library' | 'camera') => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Add a photo">
      <Button label="Take a photo" variant="outline" onPress={() => onPick('camera')} />
      <Button label="Choose from gallery" variant="outline" onPress={() => onPick('library')} />
    </Sheet>
  );
}
