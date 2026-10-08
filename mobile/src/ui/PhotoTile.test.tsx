import { fireEvent, render, screen } from '@testing-library/react-native';
import { PhotoTile } from './PhotoTile';

it('shows the label on the striped placeholder and a remove button', () => {
  const onRemove = jest.fn();
  render(<PhotoTile size={104} radius={24} label="photo · river" onRemove={onRemove} />);
  expect(screen.getByText('photo · river')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Remove photo'));
  expect(onRemove).toHaveBeenCalled();
});

it('has no remove button when read-only (feed)', () => {
  render(<PhotoTile height={170} radius={22} label="photo · basil" />);
  expect(screen.queryByLabelText('Remove photo')).toBeNull();
});

it('renders the image instead of the placeholder when it has a uri', () => {
  render(<PhotoTile size={104} radius={24} uri="file:///doc/media/a.jpg" label="ignored" />);
  expect(screen.queryByText('ignored')).toBeNull();
  expect(screen.getByLabelText('Photo')).toBeTruthy();
});
